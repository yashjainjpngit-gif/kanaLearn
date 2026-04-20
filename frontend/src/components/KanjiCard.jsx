export default function KanjiCard({ item, isLearned, onSelect }) {
  return (
    <button
      className={`kanji-card ${isLearned ? "learned" : ""}`}
      onClick={() => onSelect(item)}
      style={{ "--accent": item.categoryColor }}
    >
      <div className="kanji-card-top">
        <span className="category-pill">{item.level}</span>
        <span className="level-pill">{item.categoryName.split(" ")[0]}</span>
      </div>
      <div className="kanji-character">{item.character}</div>
      <div className="kanji-meaning">{item.meaning}</div>
      <div className="kanji-reading">{item.onyomi}</div>
    </button>
  );
}
