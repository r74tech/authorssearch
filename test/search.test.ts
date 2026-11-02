import { describe, expect, test } from "vite-plus/test";

import { ATTRIBUTIONS_ENDPOINT } from "../src/lib/attributions";
import { searchPages } from "../src/lib/search";
import { CASES } from "./cases";
import { replayFetch } from "./fixtures";

describe("searchPages", () => {
  test("同じページを指す行は1回だけ問い合わせ、入力順で重複なしに返す", async () => {
    const { impl, calls } = replayFetch();
    const results = await searchPages(
      ["scp-173", "https://scp-wiki.wikidot.com/scp-173", "https://scpwiki.com/scp-173", "SCP-173"],
      impl,
    );
    expect(results.map((r) => r.status === "found" && r.url)).toEqual([
      "https://scp-jp.wikidot.com/scp-173",
      "https://scp-wiki.wikidot.com/scp-173",
    ]);
    expect([...calls.crom].sort()).toEqual([
      "http://scp-jp.wikidot.com/scp-173",
      "http://scp-wiki.wikidot.com/scp-173",
    ]);
  });

  test("削除済みのページはold:のアーカイブ版を返す", async () => {
    const [result] = await searchPages([CASES["jp-archive-with-original"]], replayFetch().impl);
    expect(result.status === "found" && result.url).toBe("https://scp-jp.wikidot.com/old:scp-j-j");
  });

  test("未対応のURL・存在しないページはその行だけ結果に出す", async () => {
    const results = await searchPages(
      ["https://example.com/scp-173", CASES["not-found"], "scp-2000-jp"],
      replayFetch().impl,
    );
    expect(results.map((r) => r.status)).toEqual(["error", "notFound", "found"]);
    expect(results[1]).toEqual({
      status: "notFound",
      input: CASES["not-found"],
      url: "https://scp-jp.wikidot.com/authorssearch-no-such-page",
    });
  });

  test("attributionsは全ページ分を1回で問い合わせる", async () => {
    const { impl, calls } = replayFetch();
    await searchPages(["scp-2000-jp", "scp-287-jp", "b-bone-s-proposal"], impl);
    expect(calls.attributions).toHaveLength(1);
    expect(calls.attributions[0]).toEqual(
      expect.arrayContaining(["scp-2000-jp", "scp-287-jp", "b-bone-s-proposal"]),
    );
  });

  test("attributionsが落ちていてもCromの帰属で返す", async () => {
    const { impl } = replayFetch();
    const failing: typeof impl = async (url, init) =>
      url.startsWith(ATTRIBUTIONS_ENDPOINT)
        ? new Response("unavailable", { status: 503 })
        : impl(url, init);
    const [result] = await searchPages(["scp-287-jp"], failing);
    expect(result.status === "found" && result.page.attributions).toEqual([
      { user: { name: "boatOB" }, type: "AUTHOR" },
      { user: { name: "kainndo" }, type: "REWRITE" },
    ]);
  });
});
