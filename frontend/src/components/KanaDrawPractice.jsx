import { useEffect, useMemo, useRef, useState } from "react";

function getPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function redrawCanvas(canvas, strokes) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 10;
  context.strokeStyle = "#1c2230";

  strokes.forEach((stroke) => {
    if (!stroke.length) {
      return;
    }

    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);

    stroke.slice(1).forEach((point) => {
      context.lineTo(point.x, point.y);
    });

    if (stroke.length === 1) {
      context.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
    }

    context.stroke();
  });
}

export default function KanaDrawPractice({
  promptValue,
  expectedValue,
  activeTab,
  answered,
  result,
  onSubmitResult,
}) {
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGuideVisible, setIsGuideVisible] = useState(false);

  useEffect(() => {
    setStrokes([]);
    setIsDrawing(false);
    setIsGuideVisible(false);
  }, [promptValue, expectedValue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    redrawCanvas(canvas, strokes);
  }, [strokes]);

  const hasInk = useMemo(() => strokes.some((stroke) => stroke.length > 0), [strokes]);

  function handlePointerDown(event) {
    if (answered) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event, canvas);
    setIsDrawing(true);
    setStrokes((current) => [...current, [point]]);
  }

  function handlePointerMove(event) {
    if (!isDrawing || answered) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const point = getPoint(event, canvas);
    setStrokes((current) => {
      const next = [...current];
      next[next.length - 1] = [...next[next.length - 1], point];
      return next;
    });
  }

  function handlePointerUp() {
    setIsDrawing(false);
  }

  function handleUndo() {
    if (answered) {
      return;
    }

    setStrokes((current) => current.slice(0, -1));
  }

  function handleClear() {
    if (answered) {
      return;
    }

    setStrokes([]);
  }

  function handleCheck() {
    if (!hasInk) {
      return;
    }

    setIsGuideVisible(true);
  }

  return (
    <div className="draw-practice-panel">
      <div className="draw-practice-copy">
        <strong>{promptValue}</strong>
        <span>Draw the matching {activeTab === "hiragana" ? "hiragana" : "katakana"} character.</span>
      </div>

      <div className="draw-board-shell">
        <div className={`draw-guide ${isGuideVisible ? "visible" : ""}`}>
          <div className={`draw-guide-character ${activeTab}`}>{expectedValue}</div>
        </div>
        <div className="draw-guide-lines">
          <span />
          <span />
        </div>
        <canvas
          ref={canvasRef}
          className="draw-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      <div className="draw-toolbar">
        <button type="button" className="practice-ghost-button" onClick={handleUndo} disabled={!strokes.length || answered}>
          Undo
        </button>
        <button type="button" className="practice-ghost-button" onClick={handleClear} disabled={!strokes.length || answered}>
          Clear
        </button>
        <button type="button" className="practice-primary-button" onClick={handleCheck} disabled={!hasInk || answered}>
          Check
        </button>
      </div>

      {isGuideVisible ? (
        <div className="draw-feedback-card">
          <span>Guide</span>
          <strong>{expectedValue}</strong>
          <p>Compare your drawing with the guide, then mark the result.</p>
          <div className="draw-feedback-actions">
            <button
              type="button"
              className="practice-primary-button"
              onClick={() => onSubmitResult(true, "__draw__")}
              disabled={answered}
            >
              Mark Correct
            </button>
            <button
              type="button"
              className="practice-ghost-button"
              onClick={() => onSubmitResult(false, "__draw__")}
              disabled={answered}
            >
              Mark Wrong
            </button>
          </div>
          {result ? (
            <div className={`typing-quiz-feedback ${result.isCorrect ? "correct" : "wrong"}`}>
              <strong>{result.isCorrect ? "Marked correct" : "Marked wrong"}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
