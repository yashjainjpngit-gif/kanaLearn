export default function DetailPanel({ item }) {
  if (!item) {
    return (
      <aside className="detail-panel empty-panel">
        <h3>Select a kanji</h3>
        <p>Choose a card to inspect readings, level, stroke count, and example usage.</p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="kanji-badge" style={{ backgroundColor: `${item.categoryColor}18`, color: item.categoryColor }}>
        {item.character}
      </div>
      <h3>{item.meaning}</h3>
      <p className="detail-meta">{item.categoryName} · {item.level}</p>
      <dl className="detail-list">
        <div>
          <dt>Onyomi</dt>
          <dd>{item.onyomi}</dd>
        </div>
        <div>
          <dt>Kunyomi</dt>
          <dd>{item.kunyomi}</dd>
        </div>
        <div>
          <dt>Strokes</dt>
          <dd>{item.stroke_count}</dd>
        </div>
        <div>
          <dt>Example</dt>
          <dd>{item.example_word}</dd>
        </div>
        <div>
          <dt>Reading</dt>
          <dd>{item.example_reading}</dd>
        </div>
        <div>
          <dt>Meaning</dt>
          <dd>{item.example_meaning}</dd>
        </div>
      </dl>
    </aside>
  );
}
