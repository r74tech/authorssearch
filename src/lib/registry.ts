import type { DisplayEntry, PageEntry } from "./types";
import { toHttpsUrl } from "./url";

// 原語版の表示を差し替える。原語版の選定には使わず、
// 選ばれた原語版のURLが一致したときだけ効く
const PLACEHOLDER_REGISTRY: {
  url: string;
  title: string;
  author: string[];
  createdDate: string;
}[] = [
  {
    url: "https://scp-wiki.wikidot.com/scp-001-o5",
    title: "SCP-001",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/scp-321",
    title: "SCP-321",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/scp-590",
    title: "SCP-590",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/scp-963",
    title: "SCP-963",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/scp-1004",
    title: "SCP-1004",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/an-evening-with-bright",
    title: "An Evening with Dr. Bright",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/codebrown",
    title: "Code Brown",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/theselfinsert",
    title: "The Self-Insert",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
  {
    url: "https://scp-wiki.wikidot.com/dr-bright-s-personnel-file",
    title: "Dr. Bright's Personnel File",
    author: ["AdminBright"],
    createdDate: "N/A",
  },
];

// 検索したページに「補足」行を足す
const PAGE_NOTE_REGISTRY: { url: string; note: string }[] = [
  {
    url: "https://scp-jp.wikidot.com/scp-4000",
    note: "このページからリダイレクトされる https://scp-jp.wikidot.com/taboo は、fumeinadebaisuによって翻訳されたものです",
  },
];

const findPlaceholderMatch = (entry: PageEntry) => {
  const entryUrl = toHttpsUrl(entry.url).toLowerCase();
  return PLACEHOLDER_REGISTRY.find((p) => p.url.toLowerCase() === entryUrl) ?? null;
};

// registryにある原語版を本来のタイトルと作者に置き換える
export const enrichWithRegistry = (entry: PageEntry | null): DisplayEntry | null => {
  if (!entry) return entry;
  const match = findPlaceholderMatch(entry);
  if (!match) return entry;
  const mockAttributions = match.author.map((name) => ({ user: { name }, type: "AUTHOR" }));
  return {
    ...entry,
    wikidotInfo: entry.wikidotInfo
      ? { ...entry.wikidotInfo, title: match.title }
      : entry.wikidotInfo,
    attributions: mockAttributions.length > 0 ? mockAttributions : entry.attributions,
    alternateTitles: [],
    _registryCreatedDate: match.createdDate,
    _fromRegistry: true,
  };
};

export const findPageNote = (page: PageEntry): string | null => {
  const pageUrl = toHttpsUrl(page.url).toLowerCase();
  return PAGE_NOTE_REGISTRY.find((p) => p.url.toLowerCase() === pageUrl)?.note ?? null;
};
