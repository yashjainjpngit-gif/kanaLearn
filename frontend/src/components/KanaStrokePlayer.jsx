import { useEffect, useMemo, useRef, useState } from "react";

const STROKE_SVG_BASE = "https://cdn.jsdelivr.net/gh/zhengkyl/strokesvg@main/dist";

function getStrokeSvgUrl(activeTab, character) {
  const folder = activeTab === "hiragana" ? "hiragana" : "katakana";
  return `${STROKE_SVG_BASE}/${folder}/${encodeURIComponent(character)}.svg`;
}

function sanitizeStrokeSvg(svgText) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(svgText, "image/svg+xml");
  const svg = documentNode.querySelector("svg");

  if (!svg) {
    return "";
  }

  documentNode.querySelectorAll("script, foreignObject").forEach((node) => node.remove());
  svg.setAttribute("class", `${svg.getAttribute("class") ?? ""} kana-stroke-svg`.trim());
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  return svg.outerHTML;
}

export default function KanaStrokePlayer({ activeTab, character, compact = false }) {
  const [svgMarkup, setSvgMarkup] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const requestRef = useRef(0);

  const strokeSvgUrl = useMemo(
    () => getStrokeSvgUrl(activeTab, character),
    [activeTab, character]
  );

  useEffect(() => {
    let cancelled = false;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setSvgMarkup("");
    setError("");
    setVersion((current) => current + 1);

    fetch(strokeSvgUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Stroke order unavailable");
        }

        return response.text();
      })
      .then((svgText) => {
        if (!cancelled && requestRef.current === requestId) {
          setSvgMarkup(sanitizeStrokeSvg(svgText));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Stroke animation unavailable for this kana.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [strokeSvgUrl]);

  return (
    <section className={`kana-stroke-player ${compact ? "compact" : ""}`}>
      {!compact ? (
        <div className="kana-stroke-player-header">
          <div>
            <strong>Stroke Order</strong>
            <span>Animated guide for {character}</span>
          </div>
          <div className="kana-stroke-player-controls">
            <button
              type="button"
              className="practice-ghost-button"
              onClick={() => {
                setVersion((current) => current + 1);
              }}
              disabled={!svgMarkup}
            >
              Replay
            </button>
          </div>
        </div>
      ) : null}

      <div className="kana-stroke-player-stage">
        {svgMarkup ? (
          <div
            key={`${character}-${version}`}
            className="kana-stroke-svg-shell is-playing"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : error ? (
          <div className="kana-stroke-player-empty">{error}</div>
        ) : (
          <div className="kana-stroke-player-empty">Loading stroke guide...</div>
        )}
      </div>

      {compact ? (
        <button
          type="button"
          className="kana-stroke-replay-icon"
          onClick={() => {
            setVersion((current) => current + 1);
          }}
          disabled={!svgMarkup}
          aria-label="Replay stroke order"
        >
          ↻
        </button>
      ) : (
        <div className="kana-stroke-player-controls compact">
          <button
            type="button"
            className="practice-ghost-button"
            onClick={() => {
              setVersion((current) => current + 1);
            }}
            disabled={!svgMarkup}
          >
            Replay
          </button>
        </div>
      )}
    </section>
  );
}
