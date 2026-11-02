import { describe, expect, test } from "vite-plus/test";

import {
  generateLicenseLines,
  licenseLinesToText,
  selectOriginalTranslation,
} from "../src/lib/license";
import { searchPages } from "../src/lib/search";
import type { LicenseOptions } from "../src/lib/types";
import { CASES, type CaseName } from "./cases";
import { replayFetch } from "./fixtures";

// 期待値は旧authorssearch（Wikidotページ内のJS）に同じfixtureを通した出力
const OPTIONS = {
  default: { showOriginal: true, showYear: false },
  all: { showOriginal: true, showYear: true },
  minimal: { showOriginal: false, showYear: false },
} satisfies Record<string, LicenseOptions>;

const render = async (name: CaseName) => {
  const [result] = await searchPages([CASES[name]], replayFetch().impl);
  if (result.status !== "found") throw new Error(`${name}: ${result.status}`);
  const original = selectOriginalTranslation(result.page);
  return (options: LicenseOptions) =>
    licenseLinesToText(generateLicenseLines(result.page, original, options));
};

const EXPECTED: Partial<Record<CaseName, Record<keyof typeof OPTIONS, string>>> = {
  "de-translation": {
    default: [
      "タイトル: SCP-173 - Die Skulptur – Das Original",
      "原語版タイトル: SCP-173 - The Sculpture - The Original",
      "訳者: Dr_Grom",
      "原語版作者: Moto42",
      "ソース: https://scp-wiki-de.wikidot.com/scp-173",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-173 - Die Skulptur – Das Original",
      "原語版タイトル: SCP-173 - The Sculpture - The Original",
      "訳者: Dr_Grom",
      "原語版作者: Moto42",
      "ソース: https://scp-wiki-de.wikidot.com/scp-173",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2016",
      "原語版作成年: 2008",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-173 - Die Skulptur – Das Original",
      "訳者: Dr_Grom",
      "ソース: https://scp-wiki-de.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "en-original": {
    default: [
      "タイトル: SCP-173 - The Sculpture - The Original",
      "作者: Moto42",
      "ソース: https://scp-wiki.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-173 - The Sculpture - The Original",
      "作者: Moto42",
      "ソース: https://scp-wiki.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2008",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-173 - The Sculpture - The Original",
      "作者: Moto42",
      "ソース: https://scp-wiki.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-archive-with-original": {
    default: [
      "タイトル: SCP-J-J（記録用:Please click me! / お願いだから押して！）",
      "原語版タイトル: 元記事削除済み",
      "訳者: Kevin Nguyen_JP",
      "原語版作者: 元記事削除済み",
      "ソース: https://scp-jp.wikidot.com/old:scp-j-j",
      "原語版ソース: 元記事削除済み",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-J-J（記録用:Please click me! / お願いだから押して！）",
      "原語版タイトル: 元記事削除済み",
      "訳者: Kevin Nguyen_JP",
      "原語版作者: 元記事削除済み",
      "ソース: https://scp-jp.wikidot.com/old:scp-j-j",
      "原語版ソース: 元記事削除済み",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2026",
      "原語版作成年: 元記事削除済み",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-J-J（記録用:Please click me! / お願いだから押して！）",
      "訳者: Kevin Nguyen_JP",
      "ソース: https://scp-jp.wikidot.com/old:scp-j-j",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-archive-without-original": {
    default: [
      "タイトル: SCP-126-VN（記録用:Sổ Tay Tin Vịt / アヒルのデマ手帳）",
      "原語版タイトル: 元記事削除済み",
      "訳者: Kevin Nguyen_JP",
      "原語版作者: 元記事削除済み",
      "ソース: https://scp-jp.wikidot.com/old:scp-126-vn",
      "原語版ソース: 元記事削除済み",
      "ライセンス: CC BY-SA 4.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-126-VN（記録用:Sổ Tay Tin Vịt / アヒルのデマ手帳）",
      "原語版タイトル: 元記事削除済み",
      "訳者: Kevin Nguyen_JP",
      "原語版作者: 元記事削除済み",
      "ソース: https://scp-jp.wikidot.com/old:scp-126-vn",
      "原語版ソース: 元記事削除済み",
      "ライセンス: CC BY-SA 4.0",
      "作成年: 2026",
      "原語版作成年: 元記事削除済み",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-126-VN（記録用:Sổ Tay Tin Vịt / アヒルのデマ手帳）",
      "訳者: Kevin Nguyen_JP",
      "ソース: https://scp-jp.wikidot.com/old:scp-126-vn",
      "ライセンス: CC BY-SA 4.0",
    ].join("\n"),
  },
  "jp-original-coauthor": {
    default: [
      "タイトル: SCP-2000-JP - 伝書使",
      "作者: FeS_ryuukatetu, furabbit, WagnasCousin",
      "ソース: https://scp-jp.wikidot.com/scp-2000-jp",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-2000-JP - 伝書使",
      "作者: FeS_ryuukatetu, furabbit, WagnasCousin",
      "ソース: https://scp-jp.wikidot.com/scp-2000-jp",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2020",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-2000-JP - 伝書使",
      "作者: FeS_ryuukatetu, furabbit, WagnasCousin",
      "ソース: https://scp-jp.wikidot.com/scp-2000-jp",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-original-rewrite": {
    default: [
      "タイトル: SCP-287-JP - 現世利益を求めるものへ",
      "作者: boatOB, kainndo(改稿者)",
      "ソース: https://scp-jp.wikidot.com/scp-287-jp",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-287-JP - 現世利益を求めるものへ",
      "作者: boatOB, kainndo(改稿者)",
      "ソース: https://scp-jp.wikidot.com/scp-287-jp",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2014",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-287-JP - 現世利益を求めるものへ",
      "作者: boatOB, kainndo(改稿者)",
      "ソース: https://scp-jp.wikidot.com/scp-287-jp",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-original-transferer": {
    default: [
      "タイトル: broken_boneの提言 - ししまいっ！",
      "作者: broken_bone",
      "ソース: https://scp-jp.wikidot.com/b-bone-s-proposal",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: broken_boneの提言 - ししまいっ！",
      "作者: broken_bone",
      "ソース: https://scp-jp.wikidot.com/b-bone-s-proposal",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2018",
    ].join("\n"),
    minimal: [
      "タイトル: broken_boneの提言 - ししまいっ！",
      "作者: broken_bone",
      "ソース: https://scp-jp.wikidot.com/b-bone-s-proposal",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-translation-cn": {
    default: [
      "タイトル: SCP-CN-4444",
      "原語版タイトル: SCP-CN-4444 - 今天吃什么？",
      "訳者: fish_paste_slice",
      "原語版作者: breaddddd, ColorlessL",
      "ソース: https://scp-jp.wikidot.com/scp-cn-4444",
      "原語版ソース: https://scp-wiki-cn.wikidot.com/scp-cn-4444",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-CN-4444",
      "原語版タイトル: SCP-CN-4444 - 今天吃什么？",
      "訳者: fish_paste_slice",
      "原語版作者: breaddddd, ColorlessL",
      "ソース: https://scp-jp.wikidot.com/scp-cn-4444",
      "原語版ソース: https://scp-wiki-cn.wikidot.com/scp-cn-4444",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2026",
      "原語版作成年: 2025",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-CN-4444",
      "訳者: fish_paste_slice",
      "ソース: https://scp-jp.wikidot.com/scp-cn-4444",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-translation-en": {
    default: [
      "タイトル: SCP-173 - 彫刻 - オリジナル",
      "原語版タイトル: SCP-173 - The Sculpture - The Original",
      "訳者: Dr Devan",
      "原語版作者: Moto42",
      "ソース: https://scp-jp.wikidot.com/scp-173",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-173 - 彫刻 - オリジナル",
      "原語版タイトル: SCP-173 - The Sculpture - The Original",
      "訳者: Dr Devan",
      "原語版作者: Moto42",
      "ソース: https://scp-jp.wikidot.com/scp-173",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2013",
      "原語版作成年: 2008",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-173 - 彫刻 - オリジナル",
      "訳者: Dr Devan",
      "ソース: https://scp-jp.wikidot.com/scp-173",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-translation-note": {
    default: [
      "タイトル: SCP-4000 - 禁忌",
      "原語版タイトル: SCP-4000 - Taboo",
      "訳者: Fennecist",
      "原語版作者: Captain Kirby, PeppersGhost",
      "補足: このページからリダイレクトされる https://scp-jp.wikidot.com/taboo は、fumeinadebaisuによって翻訳されたものです",
      "ソース: https://scp-jp.wikidot.com/scp-4000",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-4000",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: SCP-4000 - 禁忌",
      "原語版タイトル: SCP-4000 - Taboo",
      "訳者: Fennecist",
      "原語版作者: Captain Kirby, PeppersGhost",
      "補足: このページからリダイレクトされる https://scp-jp.wikidot.com/taboo は、fumeinadebaisuによって翻訳されたものです",
      "ソース: https://scp-jp.wikidot.com/scp-4000",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-4000",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2018",
      "原語版作成年: 2022",
    ].join("\n"),
    minimal: [
      "タイトル: SCP-4000 - 禁忌",
      "訳者: Fennecist",
      "補足: このページからリダイレクトされる https://scp-jp.wikidot.com/taboo は、fumeinadebaisuによって翻訳されたものです",
      "ソース: https://scp-jp.wikidot.com/scp-4000",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-translation-registry": {
    default: [
      "タイトル: スタッフによるプレースホルダ - N/A",
      "原語版タイトル: SCP-321",
      "訳者: 訳者不明",
      "原語版作者: AdminBright",
      "ソース: https://scp-jp.wikidot.com/scp-321",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-321",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: スタッフによるプレースホルダ - N/A",
      "原語版タイトル: SCP-321",
      "訳者: 訳者不明",
      "原語版作者: AdminBright",
      "ソース: https://scp-jp.wikidot.com/scp-321",
      "原語版ソース: https://scp-wiki.wikidot.com/scp-321",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2026",
      "原語版作成年: N/A",
    ].join("\n"),
    minimal: [
      "タイトル: スタッフによるプレースホルダ - N/A",
      "訳者: 訳者不明",
      "ソース: https://scp-jp.wikidot.com/scp-321",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
  "jp-translation-unknown-translator": {
    default: [
      "タイトル: インタビュー 277-A",
      "原語版タイトル: Interview 277-A",
      "訳者: 訳者不明",
      "原語版作者: Mimi_42",
      "ソース: https://scp-jp.wikidot.com/277interview",
      "原語版ソース: https://scp-wiki.wikidot.com/277interview",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
    all: [
      "タイトル: インタビュー 277-A",
      "原語版タイトル: Interview 277-A",
      "訳者: 訳者不明",
      "原語版作者: Mimi_42",
      "ソース: https://scp-jp.wikidot.com/277interview",
      "原語版ソース: https://scp-wiki.wikidot.com/277interview",
      "ライセンス: CC BY-SA 3.0",
      "作成年: 2015",
      "原語版作成年: 2011",
    ].join("\n"),
    minimal: [
      "タイトル: インタビュー 277-A",
      "訳者: 訳者不明",
      "ソース: https://scp-jp.wikidot.com/277interview",
      "ライセンス: CC BY-SA 3.0",
    ].join("\n"),
  },
};

describe("実記事のライセンス表記", () => {
  for (const [name, expected] of Object.entries(EXPECTED) as [
    CaseName,
    Record<keyof typeof OPTIONS, string>,
  ][]) {
    test(`${name}（${CASES[name]}）`, async () => {
      const text = await render(name);
      for (const key of Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]) {
        expect(text(OPTIONS[key]), key).toBe(expected[key]);
      }
    });
  }
});

// Cromにスプラッシュページを持つ記事が見つからなかったので、この分岐だけは手で作ったデータで確かめる
test("アダルトのスプラッシュページがあればソースにそちらを出す", () => {
  const lines = generateLicenseLines(
    {
      url: "http://scp-jp.wikidot.com/scp-x-jp",
      wikidotInfo: { title: "SCP-X-JP", createdAt: "2020-01-01T00:00:00.000Z", tags: ["jp"] },
      attributions: [{ user: { name: "author" }, type: "AUTHOR" }],
      adultSplashPage: { url: "http://scp-jp.wikidot.com/adult:scp-x-jp" },
    },
    null,
    OPTIONS.default,
  );
  expect(licenseLinesToText(lines)).toContain("ソース: https://scp-jp.wikidot.com/adult:scp-x-jp");
});
