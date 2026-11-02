import { findTaggedBranchUrl } from "./license";
import type { PageEntry, SearchedPage, TranslationOf } from "./types";
import { toHttpsUrl, withArchivePrefix } from "./url";

export const CROM_ENDPOINT = "https://apiv1.crom.avn.sh/graphql";
const CROM_TIMEOUT_MS = 10_000;
const ARCHIVE_PREFIXES = ["old", "deleted"];

const ENTRY_FIELDS = `
  url
  wikidotInfo { title createdAt }
  alternateTitles { title }
  attributions { user { name } type }
  adultContentPage { url }
  adultSplashPage { url }
`;

export const SEARCH_QUERY = `
  query Search($url: URL!) {
    page(url: $url) {
      url
      wikidotInfo { title createdAt source tags }
      alternateTitles { title }
      attributions { user { name } type }
      adultContentPage { url }
      adultSplashPage { url }
      translations { ${ENTRY_FIELDS} }
      translationOf {
        ${ENTRY_FIELDS}
        translations { ${ENTRY_FIELDS} }
      }
    }
  }
`;

interface CromResponse {
  data?: { page: SearchedPage | null } | null;
  errors?: { message: string }[];
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const fetchPageData = async (
  url: string,
  fetchImpl: FetchLike = fetch,
): Promise<SearchedPage | null> => {
  const response = await fetchImpl(CROM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { url } }),
    signal: AbortSignal.timeout(CROM_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Crom API HTTP error! status: ${response.status} ${body.slice(0, 300)}`);
  }

  const json = (await response.json()) as CromResponse;
  return json.data?.page ?? null;
};

// アーカイブ版で取れなかった原語版を、最初の結果のtranslationsから組み立てる
// タグの支部を優先し、無ければ一番古いもの
export const synthesizeTranslationOf = (
  page: SearchedPage,
  candidates: PageEntry[],
): TranslationOf | null => {
  if (!candidates.length) return null;
  const langUrl = findTaggedBranchUrl(page.wikidotInfo?.tags ?? []);
  let match: PageEntry | null = null;
  if (langUrl) {
    match = candidates.find((c) => toHttpsUrl(c.url).startsWith(langUrl)) ?? null;
  }
  if (!match) {
    const sorted = candidates
      .filter((c) => c?.wikidotInfo?.createdAt)
      .sort(
        (a, b) =>
          new Date(a.wikidotInfo!.createdAt).getTime() -
          new Date(b.wikidotInfo!.createdAt).getTime(),
      );
    match = sorted[0] ?? null;
  }
  if (!match) return null;
  return { ...match, translations: candidates.filter((c) => c !== match) };
};

// wikidotInfoがnull（Wikidot上で削除済み）なら、old:とdeleted:のアーカイブ版を順に探す
// アーカイブ版は翻訳の関係が空のことがあるので、最初の結果の分を引き継ぐ
export const fetchPageWithFallback = async (
  url: string,
  fetchImpl: FetchLike = fetch,
): Promise<{ page: SearchedPage | null; resolvedUrl: string }> => {
  const firstPage = await fetchPageData(url, fetchImpl);
  if (firstPage?.wikidotInfo) return { page: firstPage, resolvedUrl: url };

  for (const prefix of ARCHIVE_PREFIXES) {
    const fallbackUrl = withArchivePrefix(url, prefix);
    if (!fallbackUrl) continue;
    const retryPage = await fetchPageData(fallbackUrl, fetchImpl);
    if (!retryPage?.wikidotInfo) continue;

    const translations = retryPage.translations?.length
      ? retryPage.translations
      : (firstPage?.translations ?? []);
    const translationOf =
      retryPage.translationOf ||
      firstPage?.translationOf ||
      synthesizeTranslationOf(retryPage, firstPage?.translations ?? []);

    return { page: { ...retryPage, translationOf, translations }, resolvedUrl: fallbackUrl };
  }
  return { page: firstPage, resolvedUrl: url };
};
