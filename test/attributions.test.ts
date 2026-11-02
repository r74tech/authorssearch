import { describe, expect, test } from "vite-plus/test";

import {
  applyAttributionOverrides,
  collectJpFullnames,
  fetchAttributionMap,
} from "../src/lib/attributions";
import { fetchPageWithFallback } from "../src/lib/crom";
import { CASES, type CaseName } from "./cases";
import { loadFixtures, replayFetch } from "./fixtures";

const fixture = (name: CaseName) => loadFixtures().find((f) => f.input === CASES[name])!;

const cromPage = async (name: CaseName) => {
  const url = `http://scp-jp.wikidot.com/${CASES[name]}`;
  const { page } = await fetchPageWithFallback(url, replayFetch().impl);
  return page!;
};

describe("applyAttributionOverrides", () => {
  test("b-bone-s-proposal: transfererを捨ててauthorだけにする", async () => {
    const page = await cromPage("jp-original-transferer");
    const map = fixture("jp-original-transferer").attributions;
    expect(map["b-bone-s-proposal"].map((a) => a.type)).toContain("transferer");
    expect(applyAttributionOverrides(page, map).attributions).toEqual([
      { user: { name: "broken_bone" }, type: "AUTHOR" },
    ]);
  });

  test("Cromの帰属が古くても、登録内容で置き換える", async () => {
    // 実記事ではCromも同じ値を返すので、Crom側だけ古い状態にして上書きを確かめる
    const page = {
      ...(await cromPage("jp-original-rewrite")),
      attributions: [{ user: { name: "boatOB" }, type: "SUBMITTER" }],
    };
    expect(
      applyAttributionOverrides(page, fixture("jp-original-rewrite").attributions).attributions,
    ).toEqual([
      { user: { name: "boatOB" }, type: "AUTHOR" },
      { user: { name: "kainndo" }, type: "REWRITE" },
    ]);
  });

  test("scp-287-jp: rewriteをREWRITEにする", async () => {
    const page = await cromPage("jp-original-rewrite");
    expect(
      applyAttributionOverrides(page, fixture("jp-original-rewrite").attributions).attributions,
    ).toEqual([
      { user: { name: "boatOB" }, type: "AUTHOR" },
      { user: { name: "kainndo" }, type: "REWRITE" },
    ]);
  });

  test("scp-173: 未登録のページはCromの帰属のまま", async () => {
    const page = await cromPage("jp-translation-en");
    expect(applyAttributionOverrides(page, {}).attributions).toEqual(page.attributions);
  });

  test("transfererしか登録が無ければCromの帰属のまま", async () => {
    const page = await cromPage("jp-original-transferer");
    const map = { "b-bone-s-proposal": [{ type: "transferer", name: "jet0620", date: null }] };
    expect(applyAttributionOverrides(page, map).attributions).toEqual(page.attributions);
  });

  test("constructorのような継承プロパティと同名のページでも落ちない", async () => {
    const page = {
      ...(await cromPage("jp-translation-en")),
      url: "http://scp-jp.wikidot.com/constructor",
    };
    expect(applyAttributionOverrides(page, {}).attributions).toEqual(page.attributions);
  });
});

describe("collectJpFullnames", () => {
  test("翻訳の関係にあるscp-jpのページだけを集める", async () => {
    const page = await cromPage("jp-original-coauthor");
    const names = collectJpFullnames(page);
    expect(names).toContain("scp-2000-jp");
    expect(names.every((name) => !name.includes("/"))).toBe(true);
  });
});

describe("fetchAttributionMap", () => {
  test("対象が無ければ問い合わせない", async () => {
    const { impl, calls } = replayFetch();
    expect(await fetchAttributionMap([], impl)).toEqual({});
    expect(calls.attributions).toHaveLength(0);
  });

  test("statusがokでなければ例外にする", async () => {
    await expect(
      fetchAttributionMap(["a"], async () => Response.json({ status: "error" })),
    ).rejects.toThrow();
  });
});
