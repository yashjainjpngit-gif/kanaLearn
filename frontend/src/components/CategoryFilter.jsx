export default function CategoryFilter({ categories, activeCategoryId, onChange }) {
  return (
    <div className="filter-row">
      <button
        className={`filter-chip ${activeCategoryId === "" ? "active" : ""}`}
        onClick={() => onChange("")}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`filter-chip ${String(activeCategoryId) === String(category.id) ? "active" : ""}`}
          onClick={() => onChange(String(category.id))}
          style={{ "--chip-accent": category.color }}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
