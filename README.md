# authorssearch

[SCP-JP 作者検索](https://scp-jp.wikidot.com/authorssearch)のソース。

SCP各支部のページURLから、ライセンス表記（タイトル・作者・訳者・原語版・ライセンス）を出す。

## 開発

```bash
npm install
npm run dev
npm run check
npm test
npm run fixtures  # テスト用の実記事データを取り直す
```

## デプロイ

mainにpushすると、GitHub Actionsでビルドして https://r74tech.github.io/authorssearch/ に公開する。初回はリポジトリのSettingsのPagesで、SourceをGitHub Actionsにしておく。

Wikidotのページには`wikidot/authorssearch.ftml`の内容を貼る。

## License

MIT
