import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// 作成年はローカル時刻で出すので、テストは旧ページを使っていた環境に合わせてJSTにする
process.env.TZ = "Asia/Tokyo";

export default defineConfig({
  // GitHub Pagesはhttps://r74tech.github.io/authorssearch/で配信される
  base: "/authorssearch/",
  plugins: [react()],
  fmt: {
    // npm run fixturesの出力をそのまま残す
    ignorePatterns: ["test/fixtures/**"],
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
