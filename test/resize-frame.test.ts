import { describe, expect, test } from "vite-plus/test";

import { buildResizerSrc, resolveFrameId, resolveSite } from "../src/lib/resize-frame";

describe("resolveSite", () => {
  test("wikidot.com 配下の referrer はそのオリジンを使う", () => {
    expect(resolveSite("https://scp-jp.wikidot.com/authorssearch", false)).toBe(
      "https://scp-jp.wikidot.com",
    );
    expect(resolveSite("http://scp-jp-sandbox3.wikidot.com/", false)).toBe(
      "http://scp-jp-sandbox3.wikidot.com",
    );
  });

  test("wikidot.com を名乗るだけの別ドメインや空の referrer は既定サイト", () => {
    expect(resolveSite("https://evil-wikidot.com/", false)).toBe("https://scp-jp.wikidot.com");
    expect(resolveSite("https://scp-jp.wikidot.com.evil.example/", false)).toBe(
      "https://scp-jp.wikidot.com",
    );
    expect(resolveSite("", false)).toBe("https://scp-jp.wikidot.com");
  });

  test("localhost は許可したときだけ使う", () => {
    expect(resolveSite("http://localhost:5300/", false)).toBe("https://scp-jp.wikidot.com");
    expect(resolveSite("http://localhost:5300/", true)).toBe("http://localhost:5300");
  });
});

test("frameId は最後の / より後ろ（クエリを含む）", () => {
  expect(resolveFrameId("https://example.workers.dev/?frame=authorssearch")).toBe(
    "?frame=authorssearch",
  );
});

test("resize-iframe.html の URL は #<高さ>/<frameId>", () => {
  expect(buildResizerSrc("https://scp-jp.wikidot.com", "?frame=authorssearch", 512)).toBe(
    "https://scp-jp.wikidot.com/common--javascript/resize-iframe.html?#512/?frame=authorssearch",
  );
});
