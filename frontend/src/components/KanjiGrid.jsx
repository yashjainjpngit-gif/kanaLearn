import EmptyState from "./EmptyState";
import KanjiCard from "./KanjiCard";

export default function KanjiGrid({ items, selectedId, onSelect, search }) {
  if (!items.length) {
    return <EmptyState search={search} />;
  }

  return (
    <section className="kanji-grid">
      {items.map((item) => (
        <KanjiCard
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}
