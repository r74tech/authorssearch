import type { FetchLike } from "./crom";
import type { Attribution, PageEntry, SearchedPage } from "./types";
import { getHostname } from "./url";

// SCP-JPのアトリビューション・メタデータ（attribution-metadata-jpと同じ内容）
// 未登録のページはキーごと返ってこない。キーは小文字のfullname
export const ATTRIBUTIONS_ENDPOINT = "https://data.scp-jp.com/api/attributions";
const ATTRIBUTIONS_TIMEOUT_MS = 5_000;
const JP_HOST = "scp-jp.wikidot.com";

export interface MetaAttribution {
  type: string;
  name: string;
  date: string | null;
}

export type AttributionMap = Record<string, MetaAttribution[]>;

// transfererは帰属に要らない（attribution-metadata-jpの説明より）。Cromでも捨てられている
const TYPE_MAP: Record<string, Attribution["type"]> = {
  author: "AUTHOR",
  rewrite: "REWRITE",
};

export const jpFullname = (url: string): string | null => {
  if (getHostname(url) !== JP_HOST) return null;
  const path = new URL(url).pathname.slice(1).toLowerCase();
  return path || null;
};

const graphEntries = (page: SearchedPage): PageEntry[] => [
  page,
  ...(page.translations ?? []),
  ...(page.translationOf ? [page.translationOf, ...(page.translationOf.translations ?? [])] : []),
];

export const collectJpFullnames = (page: SearchedPage): string[] => [
  ...new Set(
    graphEntries(page)
      .map((entry) => jpFullname(entry.url))
      .filter((name): name is string => !!name),
  ),
];

export const fetchAttributionMap = async (
  fullnames: string[],
  fetchImpl: FetchLike = fetch,
): Promise<AttributionMap> => {
  if (!fullnames.length) return {};
  const query = new URLSearchParams({ pages: fullnames.join(",") });
  const response = await fetchImpl(`${ATTRIBUTIONS_ENDPOINT}?${query}`, {
    signal: AbortSignal.timeout(ATTRIBUTIONS_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`attributions API HTTP error! status: ${response.status}`);
  const json = (await response.json()) as { status?: string; data?: AttributionMap };
  if (json.status !== "ok" || !json.data)
    throw new Error("attributions API returned non-ok status");
  return json.data;
};

const overrideEntry = <T extends PageEntry>(entry: T, map: AttributionMap): T => {
  const fullname = jpFullname(entry.url);
  const meta = fullname && Object.hasOwn(map, fullname) ? map[fullname] : undefined;
  if (!meta) return entry;
  const attributions = meta.flatMap((m): Attribution[] => {
    const type = TYPE_MAP[m.type];
    return type ? [{ user: { name: m.name }, type }] : [];
  });
  // transfererしか登録が無いと空になるので、そのときはCromの値を使う
  return attributions.length ? { ...entry, attributions } : entry;
};

// 登録のあるscp-jpのページだけ帰属を置き換える
export const applyAttributionOverrides = (
  page: SearchedPage,
  map: AttributionMap,
): SearchedPage => ({
  ...overrideEntry(page, map),
  translations: page.translations?.map((t) => overrideEntry(t, map)) ?? page.translations,
  translationOf: page.translationOf
    ? {
        ...overrideEntry(page.translationOf, map),
        translations:
          page.translationOf.translations?.map((t) => overrideEntry(t, map)) ??
          page.translationOf.translations,
      }
    : page.translationOf,
});
