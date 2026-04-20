export default function ModuleGrid({ items, activeTab, learnedSet, onSelect }) {
  return (
    <section className={`module-grid ${activeTab === "radicals" ? "module-grid-radicals" : ""}`}>
      {items.map((item) => (
        <button
          key={`${activeTab}-${item.id}`}
          className={`module-card ${learnedSet.has(item.id) ? "learned" : ""}`}
          onClick={() => onSelect(item)}
        >
          <div className="module-card-top">
            <span className="module-type">{activeTab}</span>
            {"level" in item ? <span className="level-pill">{item.level}</span> : null}
          </div>
          <div className="module-primary">
            {item.symbol ||
              item.character_symbol ||
              item.word ||
              item.pattern_name}
          </div>
          <div className="module-title">
            {item.name || item.romaji || item.reading || item.meaning}
          </div>
          <div className="module-subtitle">
            {item.meaning || item.example_meaning || item.word_type || item.structure_text}
          </div>
        </button>
      ))}
    </section>
  );
}
