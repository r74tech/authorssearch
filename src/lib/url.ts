import { DEFAULT_WIKI, scpBranches } from "./branches";

// 表示用のURLはhttpsにそろえる
export const toHttpsUrl = (url: string): string => url.replace(/^http:\/\//i, "https://");

// 支部のホスト。scpwiki.comのような独自ドメインはWikidot上のホストに読み替える
const BRANCH_HOSTS = new Map<string, string>([
  ...Object.values(scpBranches).map((url): [string, string] => {
    const host = new URL(url).hostname;
    return [host, host];
  }),
  ["scpwiki.com", "scp-wiki.wikidot.com"],
]);

export type NormalizeResult = { ok: true; url: string } | { ok: false; reason: string };

// 入力1行をCrom API v1の検索キーにする。パスだけならscp-jpのページとして扱い、
// 2段目以降（/comments/showなど）は捨てる
export const normalizeUrl = (input: string): NormalizeResult => {
  const trimmed = input.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : DEFAULT_WIKI + trimmed.replace(/^\/+/, "");

  let urlObj: URL;
  try {
    urlObj = new URL(withScheme);
  } catch {
    return { ok: false, reason: "URLとして解釈できません" };
  }

  const host = BRANCH_HOSTS.get(urlObj.hostname.toLowerCase().replace(/^www\./, ""));
  if (!host) return { ok: false, reason: "SCP各支部のWikidot以外のURLには対応していません" };

  const segment = urlObj.pathname.split("/")[1] ?? "";
  let fullname: string;
  try {
    fullname = decodeURIComponent(segment).toLowerCase();
  } catch {
    fullname = segment.toLowerCase();
  }
  if (!fullname) return { ok: false, reason: "ページが指定されていません" };

  // Crom API v1はページURLをhttp://で持っている
  return { ok: true, url: `http://${host}/${fullname}` };
};

// old:/deleted:のアーカイブ版か
export const isArchivePage = (url: string): boolean => {
  try {
    const path = new URL(url).pathname.slice(1);
    return path.startsWith("old:") || path.startsWith("deleted:");
  } catch {
    return false;
  }
};

// パスにold:/deleted:を付けたURL。付けられないとき（カテゴリ付き・パスなし）はnull
export const withArchivePrefix = (url: string, prefix: string): string | null => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.slice(1);
    if (!path || path.includes(":")) return null;
    return `${urlObj.protocol}//${urlObj.host}/${prefix}:${path}`;
  } catch {
    return null;
  }
};

export const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

export const extractPathFromUrl = (url: string): string => {
  try {
    const path = new URL(url).pathname.slice(1);
    const slashIndex = path.indexOf("/");
    return slashIndex > -1 ? path.substring(0, slashIndex) : path;
  } catch {
    return url;
  }
};

export const urlToId = (url: string): string => url.replace(/[^a-z0-9-]/gi, "_");
