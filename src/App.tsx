import { useEffect, useRef, useState, type KeyboardEvent, type SubmitEvent } from "react";

import { copyText } from "./lib/clipboard";
import { generateLicenseLines, licenseLinesToText, selectOriginalTranslation } from "./lib/license";
import { startResizeFrame } from "./lib/resize-frame";
import { MAX_INPUTS, type SearchResult, searchPages } from "./lib/search";
import type { LicenseLine, LicenseOptions, SearchedPage } from "./lib/types";

const PLACEHOLDER = [
  "https://scp-jp.wikidot.com/scp-2000-jp",
  "scp-3000-jp",
  "https://scp-wiki.wikidot.com/scp-999",
].join("\n");

function CopyButton({ text, label = "コピー" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const handleClick = async () => {
    setState((await copyText(text)) ? "done" : "failed");
    setTimeout(() => setState("idle"), 1500);
  };
  return (
    <button
      type="button"
      className={`button is-small ${state === "failed" ? "is-danger" : "is-light"}`}
      onClick={handleClick}
    >
      {state === "done" ? "コピーしました" : state === "failed" ? "コピーできません" : label}
    </button>
  );
}

function LicenseBox({ lines }: { lines: LicenseLine[] }) {
  return (
    <div className="box license-box">
      {/* 手で選択してコピーしても改行が残るよう、1行ずつdivにする */}
      <div className="license-text">
        {lines.map((line, index) => (
          <div key={index}>
            {line.href ? (
              <>
                {line.label}:{" "}
                <a href={line.href} target="_blank" rel="noopener">
                  {line.href}
                </a>
              </>
            ) : (
              `${line.label}: ${line.value}`
            )}
          </div>
        ))}
      </div>
      <div className="license-actions">
        <CopyButton text={licenseLinesToText(lines)} />
      </div>
    </div>
  );
}

const toLines = (page: SearchedPage, options: LicenseOptions) =>
  generateLicenseLines(page, selectOriginalTranslation(page), options);

export default function App() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showYear, setShowYear] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resizerRef.current) return;
    return startResizeFrame(resizerRef.current, import.meta.env.DEV);
  }, []);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const inputs = input.split("\n").filter((line) => line.trim());
    if (searching || !inputs.length) return;
    if (inputs.length > MAX_INPUTS) {
      setResults(null);
      setRequestError(`一度に検索できるのは${MAX_INPUTS}件までです`);
      return;
    }
    setSearching(true);
    setRequestError(null);
    try {
      setResults(await searchPages(inputs));
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter（macOSは⌘+Enter）で検索
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const options = { showOriginal, showYear };
  const found = (results ?? []).flatMap((r) =>
    r.status === "found" ? [{ url: r.url, lines: toLines(r.page, options) }] : [],
  );
  const problems = (results ?? []).filter((r) => r.status !== "found");
  const allText = found.map(({ lines }) => licenseLinesToText(lines)).join("\n\n");

  return (
    <section className="section p-0">
      <div className="container">
        <form ref={formRef} className="mb-4" onSubmit={handleSubmit}>
          <div className="field">
            <div className="control">
              <textarea
                className="textarea"
                aria-label="検索するページのURLまたはパス（改行区切り）"
                placeholder={PLACEHOLDER}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <p className="help">改行区切りで複数ページを一度に検索できます（Ctrl/⌘+Enterで検索）</p>
          </div>

          <div className="search-row">
            <button
              className={`button is-info${searching ? " is-loading" : ""}`}
              type="submit"
              disabled={searching}
            >
              検索
            </button>
            <div className="toggles">
              <div className="field">
                <input
                  id="toggle-original"
                  type="checkbox"
                  className="switch"
                  checked={showOriginal}
                  onChange={(event) => setShowOriginal(event.target.checked)}
                />
                <label htmlFor="toggle-original">原語版情報を表示</label>
              </div>
              <div className="field">
                <input
                  id="toggle-year"
                  type="checkbox"
                  className="switch"
                  checked={showYear}
                  onChange={(event) => setShowYear(event.target.checked)}
                />
                <label htmlFor="toggle-year">作成年を表示</label>
              </div>
            </div>
          </div>
        </form>

        {requestError && (
          <div className="notification is-danger is-light" role="alert">
            {requestError}
          </div>
        )}

        {results && (
          <div aria-live="polite">
            {found.length > 1 && (
              <div className="results-header">
                <span>{found.length}件</span>
                <CopyButton text={allText} label="すべてコピー" />
              </div>
            )}
            {found.map(({ url, lines }) => (
              <LicenseBox key={url} lines={lines} />
            ))}
            {problems.length > 0 && (
              <div className="notification is-warning is-light" role="alert">
                <ul>
                  {problems.map((problem, index) => (
                    <li key={index}>
                      {problem.status === "notFound" ? (
                        <>
                          存在しないページです:{" "}
                          <a href={problem.url} target="_blank" rel="noopener">
                            {problem.url}
                          </a>
                        </>
                      ) : problem.status === "error" ? (
                        <>
                          <code>{problem.input}</code>: {problem.message}
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <footer className="mt-5 is-size-7">
          <a href="https://crom.avn.sh/" target="_blank" rel="noopener">
            Powered by Crom
          </a>
        </footer>
      </div>
      {/* 高さの測定に使う。最後に置き、display:noneにしない */}
      <div id="resizer-container" ref={resizerRef} />
    </section>
  );
}
