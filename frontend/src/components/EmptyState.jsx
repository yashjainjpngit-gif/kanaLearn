export default function EmptyState({ search }) {
  return (
    <div className="empty-state">
      <h3>No results found</h3>
      <p>
        {search
          ? `No kanji matches "${search}".`
          : "There is no data yet. Add more rows in the MySQL seed files."}
      </p>
    </div>
  );
}
