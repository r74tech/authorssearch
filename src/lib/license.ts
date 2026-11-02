import { scpBranches } from "./branches";
import { enrichWithRegistry, findPageNote } from "./registry";
import type {
  Attribution,
  DisplayEntry,
  LicenseLine,
  LicenseOptions,
  PageEntry,
  SearchedPage,
} from "./types";
import { getHostname, isArchivePage, toHttpsUrl } from "./url";

const byCreatedAt = (a: PageEntry, b: PageEntry) =>
  new Date(a.wikidotInfo!.createdAt).getTime() - new Date(b.wikidotInfo!.createdAt).getTime();

// タグにある言語コードの支部URL
export const findTaggedBranchUrl = (tags: string[]): string | null =>
  Object.entries(scpBranches).find(([lang]) => tags.includes(lang.toLowerCase()))?.[1] ?? null;

// 原語版を決める。タグの言語コードの支部を優先し、決まらなければ一番古いもの
export const selectOriginalTranslation = (page: SearchedPage): PageEntry | null => {
  if (!page.translationOf) return null;

  const allCandidates = [page.translationOf, ...(page.translationOf.translations ?? [])].filter(
    (entry) => entry?.wikidotInfo?.createdAt,
  );
  if (!allCandidates.length) return null;

  const sorted = [...allCandidates].sort(byCreatedAt);

  // タグで決まるならcreatedAtは見ない
  const langUrl = findTaggedBranchUrl(page.wikidotInfo?.tags ?? []);
  if (langUrl) {
    const langMatch = sorted.find((t) => toHttpsUrl(t.url).startsWith(langUrl));
    if (langMatch) return langMatch;
  }

  return sorted[0];
};

const getUserName = (attr: Attribution) => attr.user?.name || "Unknown Author";

const getArticleTitle = (page: PageEntry) => {
  const alternateTitle = page.alternateTitles?.[0]?.title;
  const title = page.wikidotInfo?.title ?? "";
  return alternateTitle ? `${title} - ${alternateTitle}` : title;
};

const getCreatedYear = (page: DisplayEntry) => {
  if (page._registryCreatedDate?.toLowerCase() === "n/a") return "N/A";
  return `${new Date(page.wikidotInfo!.createdAt).getFullYear()}`;
};

const getAttributionNames = (
  attributions: Attribution[] | null | undefined,
  predicate: (attr: Attribution) => boolean,
  formatter: (attr: Attribution) => string = getUserName,
) => (attributions ?? []).filter(predicate).map(formatter).filter(Boolean).join(", ");

const formatAuthorAttribution = (attr: Attribution) =>
  attr.type === "REWRITE" ? `${getUserName(attr)}(改稿者)` : getUserName(attr);

const isAuthorOrSubmitter = (attr: Attribution) =>
  attr.type === "AUTHOR" || attr.type === "SUBMITTER";

const isTranslatorOrSubmitter = (attr: Attribution) =>
  attr.type === "TRANSLATOR" || attr.type === "SUBMITTER";

const isJpTranslationAttribution = (attr: Attribution) =>
  isTranslatorOrSubmitter(attr) || attr.type === "AUTHOR";

// ライセンス表記の行を返す
export const generateLicenseLines = (
  page: SearchedPage,
  originalTranslation: PageEntry | null,
  { showOriginal, showYear }: LicenseOptions,
): LicenseLine[] => {
  const lines: LicenseLine[] = [];
  const tags = page.wikidotInfo?.tags ?? [];

  lines.push({ label: "タイトル", value: getArticleTitle(page) });

  // 原語版か翻訳か
  const currentDomain = getHostname(page.url);
  const isJpDomain = currentDomain === "scp-jp.wikidot.com";
  const hasJpTag = tags.includes("jp");

  // アーカイブ版のときと「元記事削除」タグがあるときは、原語版を削除済みと表示する
  const shouldMarkOriginalDeleted = isArchivePage(page.url) || tags.includes("元記事削除");

  // registryにあればタイトルと作者を差し替える
  const originalArticle = enrichWithRegistry(originalTranslation);
  const isOriginalArticle = (() => {
    if (isJpDomain) return hasJpTag;
    if (!originalArticle) return (page.translations?.length ?? 0) > 0;
    return getHostname(originalArticle.url) === currentDomain;
  })();

  if (showOriginal && !isOriginalArticle) {
    if (shouldMarkOriginalDeleted) {
      lines.push({ label: "原語版タイトル", value: "元記事削除済み" });
    } else if (originalArticle?.wikidotInfo) {
      lines.push({ label: "原語版タイトル", value: getArticleTitle(originalArticle) });
    }
  }

  // 作者・訳者
  if (isOriginalArticle) {
    lines.push({
      label: "作者",
      value: getAttributionNames(page.attributions, () => true, formatAuthorAttribution),
    });
  } else {
    const translatorPredicate =
      isJpDomain && !hasJpTag ? isJpTranslationAttribution : isTranslatorOrSubmitter;
    const translators = getAttributionNames(page.attributions, translatorPredicate);

    if (!translators && isJpDomain && !hasJpTag) {
      const authors = getAttributionNames(page.attributions, (attr) => attr.type === "AUTHOR");
      lines.push({ label: "訳者", value: authors || "不明" });
    } else {
      lines.push({ label: "訳者", value: translators || "不明" });
    }

    if (showOriginal) {
      if (shouldMarkOriginalDeleted) {
        lines.push({ label: "原語版作者", value: "元記事削除済み" });
      } else if (originalArticle?.attributions) {
        lines.push({
          label: "原語版作者",
          value: getAttributionNames(
            originalArticle.attributions,
            (attr) => attr.type === "REWRITE" || isAuthorOrSubmitter(attr),
            (attr) => (attr.type === "REWRITE" ? formatAuthorAttribution(attr) : getUserName(attr)),
          ),
        });
      }
    }
  }

  const note = findPageNote(page);
  if (note) lines.push({ label: "補足", value: note });

  lines.push({ label: "ソース", href: toHttpsUrl(page.adultSplashPage?.url || page.url) });

  if (showOriginal && !isOriginalArticle) {
    if (shouldMarkOriginalDeleted) {
      // 削除済みならURLは出さない
      lines.push({ label: "原語版ソース", value: "元記事削除済み" });
    } else if (originalArticle) {
      lines.push({
        label: "原語版ソース",
        href: toHttpsUrl(originalArticle.adultSplashPage?.url || originalArticle.url),
      });
    }
  }

  const licenseVersion = page.wikidotInfo?.source?.includes("credit:cc4") ? "4.0" : "3.0";
  lines.push({ label: "ライセンス", value: `CC BY-SA ${licenseVersion}` });

  if (showYear) {
    lines.push({ label: "作成年", value: getCreatedYear(page) });
    if (!isOriginalArticle) {
      if (shouldMarkOriginalDeleted) {
        lines.push({ label: "原語版作成年", value: "元記事削除済み" });
      } else if (originalArticle?.wikidotInfo) {
        lines.push({ label: "原語版作成年", value: getCreatedYear(originalArticle) });
      }
    }
  }

  return lines;
};

export const licenseLinesToText = (lines: LicenseLine[]): string =>
  lines.map((line) => `${line.label}: ${line.href ?? line.value}`).join("\n");
