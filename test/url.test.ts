import { describe, expect, test } from "vite-plus/test";

import { extractPathFromUrl, normalizeUrl, urlToId, withArchivePrefix } from "../src/lib/url";

describe("normalizeUrl", () => {
  test("パスだけの入力は scp-jp の http URL にする", () => {
    expect(normalizeUrl("SCP-3000-JP")).toEqual({
      ok: true,
      url: "http://scp-jp.wikidot.com/scp-3000-jp",
    });
  });

  test("他支部のURLは支部のホストを保ち、パスは1段目だけ使う", () => {
    expect(normalizeUrl(" https://scp-wiki.wikidot.com/scp-999/comments/show ")).toEqual({
      ok: true,
      url: "http://scp-wiki.wikidot.com/scp-999",
    });
  });

  test("scpwiki.com は EN 支部として扱う", () => {
    expect(normalizeUrl("https://www.scpwiki.com/scp-173")).toEqual({
      ok: true,
      url: "http://scp-wiki.wikidot.com/scp-173",
    });
  });

  test("未対応ホスト・ページ未指定はエラー", () => {
    expect(normalizeUrl("https://example.com/scp-173").ok).toBe(false);
    expect(normalizeUrl("https://scp-jp.wikidot.com/").ok).toBe(false);
  });
});

describe("withArchivePrefix", () => {
  test("パスに接頭辞を付ける", () => {
    expect(withArchivePrefix("http://scp-jp.wikidot.com/scp-x", "old")).toBe(
      "http://scp-jp.wikidot.com/old:scp-x",
    );
  });

  test("カテゴリ付きや空パスは null", () => {
    expect(withArchivePrefix("http://scp-jp.wikidot.com/old:scp-x", "deleted")).toBeNull();
    expect(withArchivePrefix("http://scp-jp.wikidot.com/", "old")).toBeNull();
  });
});

test("urlToId は重複判定用に記号を _ にする", () => {
  expect(urlToId(extractPathFromUrl("http://scp-jp.wikidot.com/adult:scp-x/a"))).toBe(
    "adult_scp-x",
  );
});
