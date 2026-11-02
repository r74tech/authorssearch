// Wikidotのiframeの高さを中身に合わせる。scpwiki/interwikiのresizeIframe.jsを移植
// https://github.com/scpwiki/interwiki/blob/main/js/resizeIframe.js
//
// 隠しiframeで親サイトの/common--javascript/resize-iframe.html#<高さ>/<frameId>を開くと、
// Wikidot側がsrcの末尾が/<frameId>のiframe.html-block-iframeを探して高さを変える

const DEFAULT_SITE = "https://scp-jp.wikidot.com";
const RESIZE_PATH = "/common--javascript/resize-iframe.html";

// resize-iframe.htmlは親ページと同じオリジンで開かないと効かない
export const resolveSite = (referrer: string, allowLocalhost: boolean): string => {
  try {
    const { protocol, hostname, origin } = new URL(referrer);
    if (!/^https?:$/.test(protocol)) return DEFAULT_SITE;
    if (hostname === "wikidot.com" || hostname.endsWith(".wikidot.com")) return origin;
    if (allowLocalhost && (hostname === "localhost" || hostname === "127.0.0.1")) return origin;
  } catch {
    // referrerが空か壊れているときはscp-jpに投げる
  }
  return DEFAULT_SITE;
};

// srcの最後の/より後ろ。Wikidotはこれでiframeを探す
export const resolveFrameId = (href: string): string => href.replace(/^.*\//, "");

export const buildResizerSrc = (site: string, frameId: string, height: number): string =>
  `${site}${RESIZE_PATH}?#${height}/${frameId}`;

export const debounce = <A extends unknown[]>(func: (...args: A) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// containerは文書の末尾に置き、その上端を文書の高さとして使う（bodyのclientHeightだとmarginが入らない）
// containerをdisplay:noneにすると位置が取れないので、隠すのはresizerの方
export const createResizeIframe = (
  container: HTMLElement,
  site: string,
  frameId: string,
  debounceTime = 150,
) => {
  const resizer = document.createElement("iframe");
  resizer.style.display = "none";
  resizer.setAttribute("aria-hidden", "true");
  resizer.tabIndex = -1;
  container.appendChild(resizer);

  const resize = () => {
    let height = container.getBoundingClientRect().top + window.scrollY;
    // 小数点以下の誤差でスクロールバーが出るので、切り上げて1px足す
    if (height) height = Math.ceil(height) + 1;
    const next = buildResizerSrc(site, frameId, height);
    if (resizer.src !== next) {
      // 同じsrcを入れ直しても読み込まれないので、一度about:blankを挟む
      resizer.src = "about:blank";
      setTimeout(() => {
        resizer.src = next;
      }, 50);
    }
  };

  return { resize: debounce(resize, debounceTime), dispose: () => resizer.remove() };
};

// iframeの中で開かれたときだけ動かす。戻り値を呼ぶと止まる
export const startResizeFrame = (container: HTMLElement, allowLocalhost: boolean): (() => void) => {
  if (window.parent === window) return () => {};

  const site = resolveSite(document.referrer, allowLocalhost);
  const frameId = resolveFrameId(location.href);
  const { resize, dispose } = createResizeIframe(container, site, frameId);

  const observer = new ResizeObserver(() => resize());
  observer.observe(document.documentElement);
  observer.observe(document.body);
  resize();

  return () => {
    observer.disconnect();
    dispose();
  };
};
