import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { ATTRIBUTIONS_ENDPOINT, type MetaAttribution } from "../src/lib/attributions";
import { CROM_ENDPOINT, type FetchLike } from "../src/lib/crom";
import type { SearchedPage } from "../src/lib/types";

export const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

// 1ケース分の実APIの応答。cromは問い合わせたURLごとのpage、attributionsは返ってきたdata
export interface Fixture {
  input: string;
  crom: Record<string, SearchedPage | null>;
  attributions: Record<string, MetaAttribution[]>;
}

export const loadFixtures = (): Fixture[] =>
  readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(FIXTURES_DIR, name), "utf8")) as Fixture);

// 記録した応答を返すfetch。attributionsは本物と同じく、問い合わせたページのうち登録のあるものだけ返す
export const replayFetch = (fixtures: Fixture[] = loadFixtures()) => {
  const crom = Object.assign({}, ...fixtures.map((f) => f.crom)) as Fixture["crom"];
  const attributions = Object.assign(
    {},
    ...fixtures.map((f) => f.attributions),
  ) as Fixture["attributions"];
  const calls = { crom: [] as string[], attributions: [] as string[][] };

  const impl: FetchLike = async (input, init) => {
    if (input === CROM_ENDPOINT) {
      const url = JSON.parse(String(init?.body)).variables.url as string;
      calls.crom.push(url);
      if (!(url in crom)) throw new Error(`fixtureに無いURL: ${url}（npm run fixturesで取り直す）`);
      return Response.json({ data: { page: crom[url] } });
    }
    if (input.startsWith(ATTRIBUTIONS_ENDPOINT)) {
      const pages = new URL(input).searchParams.get("pages")!.split(",");
      calls.attributions.push(pages);
      const data = Object.fromEntries(
        pages.flatMap((p) => (p in attributions ? [[p, attributions[p]]] : [])),
      );
      return Response.json({ status: "ok", data });
    }
    throw new Error(`想定外のfetch: ${input}`);
  };
  return { impl, calls };
};
