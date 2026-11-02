import {
  type AttributionMap,
  applyAttributionOverrides,
  collectJpFullnames,
  fetchAttributionMap,
} from "./attributions";
import { type FetchLike, fetchPageWithFallback } from "./crom";
import type { SearchedPage } from "./types";
import { normalizeUrl, toHttpsUrl } from "./url";

export const MAX_INPUTS = 50;
const CROM_CONCURRENCY = 5;

export type SearchResult =
  | { status: "found"; input: string; url: string; page: SearchedPage }
  | { status: "notFound"; input: string; url: string }
  | { status: "error"; input: string; message: string };

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = Array.from({ length: items.length });
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const cromErrorMessage = (error: unknown) =>
  error instanceof DOMException && error.name === "TimeoutError"
    ? "Crom APIが応答しませんでした"
    : "Crom APIの呼び出しに失敗しました";

type Lookup =
  | { status: "found"; url: string; page: SearchedPage }
  | { status: "notFound"; url: string }
  | { status: "error"; message: string };

// 入力行をまとめて検索する。同じページの行は1回だけ問い合わせ、入力順で重複なしに返す
// attributionsは全ページ分を1回で取る。失敗したらCromの帰属のまま返す
export const searchPages = async (
  inputs: string[],
  fetchImpl: FetchLike = fetch,
): Promise<SearchResult[]> => {
  const normalized = inputs.map((input) => ({ input, key: normalizeUrl(input) }));
  const keys = [...new Set(normalized.flatMap(({ key }) => (key.ok ? [key.url] : [])))];

  const lookups = new Map<string, Lookup>();
  await mapWithConcurrency(keys, CROM_CONCURRENCY, async (key) => {
    try {
      const { page, resolvedUrl } = await fetchPageWithFallback(key, fetchImpl);
      lookups.set(
        key,
        page?.wikidotInfo
          ? { status: "found", url: toHttpsUrl(page.url), page }
          : { status: "notFound", url: toHttpsUrl(resolvedUrl) },
      );
    } catch (error) {
      console.error("Crom API error", key, error);
      lookups.set(key, { status: "error", message: cromErrorMessage(error) });
    }
  });

  const found = [...lookups.values()].flatMap((l) => (l.status === "found" ? [l.page] : []));
  let attributionMap: AttributionMap = {};
  try {
    attributionMap = await fetchAttributionMap(
      [...new Set(found.flatMap(collectJpFullnames))],
      fetchImpl,
    );
  } catch (error) {
    console.error("attributions API error", error);
  }

  // old:のフォールバックや表記揺れで別の行が同じページになることがあるので、
  // 解決後のURLでも重複を除く
  const seenKeys = new Set<string>();
  const seenPages = new Set<string>();
  return normalized.flatMap(({ input, key }): SearchResult[] => {
    if (!key.ok) return [{ status: "error", input, message: key.reason }];
    if (seenKeys.has(key.url)) return [];
    seenKeys.add(key.url);
    const lookup = lookups.get(key.url)!;
    if (lookup.status === "error") return [{ status: "error", input, message: lookup.message }];
    if (lookup.status === "notFound") return [{ status: "notFound", input, url: lookup.url }];
    const pageKey = lookup.url.toLowerCase();
    if (seenPages.has(pageKey)) return [];
    seenPages.add(pageKey);
    return [
      {
        status: "found",
        input,
        url: lookup.url,
        page: applyAttributionOverrides(lookup.page, attributionMap),
      },
    ];
  });
};
