import { useEffect, useRef, useState } from "react";

const STROKE_DURATION = 0.5; // seconds per stroke
const STROKE_GAP = 0.55; // seconds between strokes

function getKanjiSvgUrl(char) {
  const code = char.codePointAt(0).toString(16).padStart(5, "0");
  return `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${code}.svg`;
}

function animateStrokes(container) {
  const svg = container.querySelector("svg");
  if (!svg) return;

  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("viewBox", "0 0 109 109");
  svg.style.cssText = "width:100%;height:100%;display:block;";

  // Mute the stroke number labels
  svg.querySelectorAll("text").forEach((t) => {
    t.removeAttribute("style");
    t.style.fill = "#bec4cc";
    t.style.fontSize = "7px";
    t.style.fontFamily = "sans-serif";
  });

  // Only animate paths inside the StrokePaths group
  const strokeGroup = svg.querySelector("[id*='StrokePaths']");
  const paths = strokeGroup ? strokeGroup.querySelectorAll("path") : svg.querySelectorAll("path");

  paths.forEach((path, i) => {
    let len;
    try {
      len = path.getTotalLength();
    } catch {
      return;
    }

    // Apply base style
    path.style.fill = "none";
    path.style.stroke = "#1c2230";
    path.style.strokeWidth = "3";
    path.style.strokeLinecap = "round";
    path.style.strokeLinejoin = "round";

    // Reset animation
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    path.style.animation = "none";

    // Force reflow so the browser registers the reset
    void path.getBoundingClientRect();

    // Start draw animation staggered by stroke index
    path.style.animation = `stroke-draw ${STROKE_DURATION}s ease forwards ${i * STROKE_GAP}s`;
  });
}

export default function StrokeOrderDiagram({ char }) {
  const [svgHtml, setSvgHtml] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [animKey, setAnimKey] = useState(0);
  const containerRef = useRef(null);

  // Fetch SVG when char changes
  useEffect(() => {
    if (!char) return;
    setStatus("loading");
    setSvgHtml(null);

    fetch(getKanjiSvgUrl(char))
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.text();
      })
      .then((text) => {
        // Strip XML declaration, DOCTYPE, and comments — keep only the <svg> element
        const svgStart = text.indexOf("<svg");
        setSvgHtml(svgStart >= 0 ? text.slice(svgStart) : text);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [char]);

  // Run animation after SVG is injected or replay is triggered
  useEffect(() => {
    if (status !== "ok" || !containerRef.current) return;
    animateStrokes(containerRef.current);
  }, [status, animKey]);

  return (
    <div className="stroke-order-section">
      <span className="reading-section-label">Stroke Order</span>
      <div className="stroke-order-box">
        {status === "loading" && (
          <div className="stroke-order-placeholder">Loading…</div>
        )}
        {status === "error" && (
          <div className="stroke-order-placeholder">Not available for this character</div>
        )}
        {status === "ok" && svgHtml && (
          <>
            <div
              ref={containerRef}
              className="stroke-order-svg-container"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
            <button
              type="button"
              className="stroke-order-replay-btn"
              onClick={() => setAnimKey((k) => k + 1)}
            >
              ↺ Replay
            </button>
          </>
        )}
      </div>
    </div>
  );
}
