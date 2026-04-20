import StrokeOrderDiagram from "./StrokeOrderDiagram";

export default function KanjiModal({ item, isLearned, onClose, onToggleLearn }) {
  if (!item) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          {"\u00d7"}
        </button>
        <div className="modal-top">
          <div className="modal-character">{item.character}</div>
          <h3>{item.meaning}</h3>
          <div className="modal-badges">
            <span className="mini-badge level">{item.level}</span>
            <span>{item.stroke_count} strokes</span>
          </div>
        </div>
        <div className="modal-panel">
          <div className="modal-grid">
            <article className="modal-info-card">
              <span>On&apos;yomi</span>
              <strong>{item.onyomi}</strong>
            </article>
            <article className="modal-info-card">
              <span>Kun&apos;yomi</span>
              <strong>{item.kunyomi}</strong>
            </article>
            <article className="modal-info-card">
              <span>Strokes</span>
              <strong>{item.stroke_count}</strong>
            </article>
            <article className="modal-info-card">
              <span>Level</span>
              <strong>{item.level}</strong>
            </article>
          </div>
          <StrokeOrderDiagram char={item.character} />
          <article className="example-card">
            <span>Example Word</span>
            <strong>{item.example_word}</strong>
            <p>
              {item.example_reading} {"\u2014"} {item.example_meaning}
            </p>
          </article>
        </div>
        <button className="learned-button" onClick={() => onToggleLearn(item.id)}>
          {isLearned ? "Learned" : "Mark as Learned"}
        </button>
      </div>
    </div>
  );
}
