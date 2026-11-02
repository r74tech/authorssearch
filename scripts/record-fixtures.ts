// test/cases.tsの記事について、CromとattributionsのAPIの実際の応答をtest/fixtures/に保存する
// 使い方: npm run fixtures
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ATTRIBUTIONS_ENDPOINT } from "../src/lib/attributions";
import { CROM_ENDPOINT, type FetchLike } from "../src/lib/crom";
import { searchPages } from "../src/lib/search";
import type { SearchedPage } from "../src/lib/types";
import { CASES } from "../test/cases";
import { FIXTURES_DIR, type Fixture } from "../test/fixtures";

// sourceは全文だと大きいので、ライセンスの判定に使うcredit:の行だけ残す
const trimSource = (page: SearchedPage | null): SearchedPage | null => {
  if (!page?.wikidotInfo?.source) return page;
  const credits = page.wikidotInfo.source.split("\n").filter((line) => line.includes("credit:"));
  return { ...page, wikidotInfo: { ...page.wikidotInfo, source: credits.join("\n") } };
};

// CromはUser-Agentが無いと400を返す。Node.jsのfetchは付けるが、念のため明示する
const USER_AGENT = "scp-jp-authorssearch (+https://github.com/r74tech/authorssearch)";

mkdirSync(FIXTURES_DIR, { recursive: true });

for (const [name, input] of Object.entries(CASES)) {
  const fixture: Fixture = { input, crom: {}, attributions: {} };
  // searchPagesはAPIの失敗を結果に吸収するので、ここで失敗を拾って保存しないようにする
  let failed = false;
  const record = async (url: string, init: RequestInit | undefined) => {
    const headers = new Headers(init?.headers);
    headers.set("User-Agent", USER_AGENT);
    const response = await fetch(url, { ...init, headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.clone().json()) as { data?: unknown; status?: string };
    if (url === CROM_ENDPOINT) {
      if (!json.data) throw new Error("Cromの応答にdataが無い");
      fixture.crom[JSON.parse(String(init?.body)).variables.url] = trimSource(
        (json.data as { page: SearchedPage | null }).page,
      );
    } else if (url.startsWith(ATTRIBUTIONS_ENDPOINT)) {
      if (json.status !== "ok" || !json.data) throw new Error("attributionsの応答がokでない");
      Object.assign(fixture.attributions, json.data as Fixture["attributions"]);
    }
    return response;
  };
  const recording: FetchLike = async (url, init) => {
    try {
      return await record(url, init);
    } catch (error) {
      failed = true;
      throw error;
    }
  };

  const [result] = await searchPages([input], recording);
  if (failed || result.status === "error") {
    console.error(`${name}: 取得に失敗したので保存しない`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(join(FIXTURES_DIR, `${name}.json`), `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`${name}: ${result.status}`);
}
