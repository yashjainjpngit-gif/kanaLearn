import { useState } from "react";

const CATEGORIES = ["all", "objects", "animate", "time", "order", "generic"];

function CounterCard({ item, expanded, onToggle }) {
  return (
    <div className="counter-card">
      <div className="counter-card-header">
        <span className="counter-char">{item.counter}</span>
        <div className="counter-header-right">
          <div className="counter-readings">
            {item.readings.map((r, i) => (
              <span key={i} className="counter-reading-badge">{r}</span>
            ))}
          </div>
          <span className={`counter-category-badge counter-category-${item.category}`}>
            {item.category}
          </span>
        </div>
      </div>

      <p className="counter-meaning">{item.meaning}</p>

      <div className="counter-applies-to">
        {item.appliesToJa.map((ja, i) => (
          <span key={i} className="counter-applies-chip">
            <span className="applies-ja">{ja}</span>
            {item.appliesTo[i] && <span className="applies-en">{item.appliesTo[i]}</span>}
          </span>
        ))}
      </div>

      <div className="conjugation-table-wrapper">
        <table className="conjugation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>漢字</th>
              <th>読み方</th>
              <th>Romaji</th>
            </tr>
          </thead>
          <tbody>
            {item.conjugations.map((conj, i) => (
              <tr key={i} className={conj.irregular ? "conj-irregular" : ""}>
                <td className="conj-num">{conj.number === null ? "?" : conj.number}</td>
                <td className="conj-kanji">{conj.kanji}</td>
                <td className={`conj-reading ${conj.irregular ? "conj-reading-irregular" : ""}`}>
                  {conj.reading}
                </td>
                <td className="conj-romaji">{conj.romaji}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {item.notes && (
        <p className="counter-notes">{item.notes}</p>
      )}

      <button className="counter-sentences-toggle" onClick={onToggle}>
        {expanded
          ? "Hide examples"
          : `Show ${item.exampleSentences.length} example${item.exampleSentences.length !== 1 ? "s" : ""}`}
      </button>

      {expanded && (
        <div className="counter-example-sentences">
          {item.exampleSentences.map((s, i) => (
            <div key={i} className="counter-sentence">
              <p className="sentence-ja">{s.japanese}</p>
              <p className="sentence-reading">{s.reading}</p>
              <p className="sentence-en">{s.english}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CountersView({ items, search }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const filtered = items.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  function toggleSentences(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="counters-view">
      <div className="counters-category-filter">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`counter-cat-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="counters-empty">
          {search ? `No counters match "${search}"` : "No counters in this category."}
        </p>
      )}

      <div className="counters-grid">
        {filtered.map((item) => (
          <CounterCard
            key={item.id}
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => toggleSentences(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
