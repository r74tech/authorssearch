// テストに使う実記事。fixtureはnpm run fixturesで取り直せる
export const CASES = {
  "jp-original-coauthor": "scp-2000-jp",
  "jp-original-rewrite": "scp-287-jp",
  "jp-original-transferer": "b-bone-s-proposal",
  "jp-translation-en": "scp-173",
  "jp-translation-unknown-translator": "277interview",
  "jp-translation-cn": "scp-cn-4444",
  "jp-translation-registry": "scp-321",
  "jp-translation-note": "scp-4000",
  "jp-archive-with-original": "scp-j-j",
  "jp-archive-without-original": "scp-126-vn",
  "en-original": "https://scp-wiki.wikidot.com/scp-173",
  "de-translation": "https://scp-wiki-de.wikidot.com/scp-173",
  "not-found": "authorssearch-no-such-page",
} as const;

export type CaseName = keyof typeof CASES;
