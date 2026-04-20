export default function StatsBar({ total, categories }) {
  return (
    <section className="stats-grid">
      <article className="stat-card">
        <span>Total Kanji</span>
        <strong>{total}</strong>
      </article>
      <article className="stat-card">
        <span>Categories</span>
        <strong>{categories}</strong>
      </article>
      <article className="stat-card">
        <span>Source</span>
        <strong>MySQL</strong>
      </article>
    </section>
  );
}
