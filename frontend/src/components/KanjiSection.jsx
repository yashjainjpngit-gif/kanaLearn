import KanjiCard from "./KanjiCard";

export default function KanjiSection({ category, items, learnedSet, onSelect }) {
  return (
    <section className="kanji-section" id={`category-${category.id}`}>
      <div className="section-heading">
        <div
          className="section-icon"
          style={{ color: category.color, backgroundColor: `${category.color}12` }}
        >
          {category.name.split(" ").at(-1)}
        </div>
        <div>
          <h2>{category.name.split(" ")[0]}</h2>
          <p>{items.length} kanji</p>
        </div>
      </div>
      <div className="kanji-grid">
        {items.map((item) => (
          <KanjiCard
            key={item.id}
            item={item}
            isLearned={learnedSet.has(item.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
