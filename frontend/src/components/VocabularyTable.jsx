import { useMemo, useState } from "react";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];

const KANA_GROUPS = [
  { key: "A", kana: "あ" }, { key: "K", kana: "か" }, { key: "S", kana: "さ" },
  { key: "T", kana: "た" }, { key: "N", kana: "な" }, { key: "H", kana: "は" },
  { key: "M", kana: "ま" }, { key: "Y", kana: "や" }, { key: "R", kana: "ら" },
  { key: "W", kana: "わ" }, { key: "G", kana: "が" }, { key: "Z", kana: "ざ" },
  { key: "D", kana: "だ" }, { key: "B", kana: "ば" }, { key: "P", kana: "ぱ" },
];

function compareLevel(a, b) {
  const rank = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };
  return (rank[a] ?? 99) - (rank[b] ?? 99);
}

function sortRows(rows, field, dir, learnedSet) {
  const mult = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (field) {
      case "word":
        return mult * String(a.word ?? "").localeCompare(String(b.word ?? ""), "ja");
      case "reading":
        return mult * String(a.reading ?? "").localeCompare(String(b.reading ?? ""), "ja");
      case "meaning":
        return mult * String(a.meaning ?? "").localeCompare(String(b.meaning ?? ""));
      case "level":
        return mult * compareLevel(a.level, b.level);
      case "type":
        return mult * String(a.word_type ?? "").localeCompare(String(b.word_type ?? ""));
      case "status":
        return mult * ((learnedSet.has(a.id) ? 1 : 0) - (learnedSet.has(b.id) ? 1 : 0));
      default:
        return 0;
    }
  });
}

function LevelBadge({ level }) {
  if (!level) return <span className="vocab-no-level">—</span>;
  return <span className={`vocab-level-badge vocab-level-${level.toLowerCase()}`}>{level}</span>;
}

// ── Card view ────────────────────────────────────────────────────────────────
function VocabCardGrid({ items, learnedSet, onSelect, onToggleLearn }) {
  const [revealedIds, setRevealedIds] = useState(new Set());

  function toggleReveal(id) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="vocab-card-grid">
      {items.map((item) => {
        const learned = learnedSet.has(item.id);
        const revealed = revealedIds.has(item.id);
        return (
          <div
            key={item.id ?? `${item.word}-${item.reading}`}
            className={`vocab-card-item ${learned ? "vocab-card-item--learned" : ""}`}
          >
            <div className="vocab-card-badges">
              <LevelBadge level={item.level} />
              {item.word_type && (
                <span className="vocabulary-type-pill vocab-card-type">{item.word_type}</span>
              )}
            </div>

            {/* Kanji word (only if different from reading) */}
            {item.word !== item.reading && (
              <button
                type="button"
                className="vocab-card-kanji"
                onClick={() => onSelect(item)}
                title="View details"
              >
                {item.word}
              </button>
            )}

            {/* Reading — always shown */}
            <div className="vocab-card-kana">{item.reading}</div>

            {/* Meaning */}
            <div className="vocab-card-meaning">{item.meaning}</div>

            {/* Romaji — hidden by default, reveal on click */}
            <div className="vocab-card-romaji-area">
              {revealed ? (
                <span
                  className="vocab-card-romaji"
                  onClick={() => toggleReveal(item.id)}
                  title="Click to hide"
                >
                  {item.romaji || item.reading}
                </span>
              ) : (
                <button
                  type="button"
                  className="vocab-card-reveal-btn"
                  onClick={() => toggleReveal(item.id)}
                >
                  romaji
                </button>
              )}
            </div>

            {/* Learned toggle */}
            <button
              type="button"
              className={`vocab-card-learn-btn ${learned ? "learned" : ""}`}
              onClick={() => onToggleLearn(item.id)}
              aria-label={learned ? "Unmark as learned" : "Mark as learned"}
            >
              {learned ? "✓ Learned" : "Mark learned"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VocabularyTable({
  items,
  total,
  limit,
  offset,
  activeType,
  activeLevel,
  activeKana,
  levelCounts,
  learnedSet,
  onTypeChange,
  onLevelChange,
  onKanaChange,
  onSelect,
  onPageChange,
  onToggleLearn,
}) {
  const [sortField, setSortField] = useState("reading");
  const [sortDir, setSortDir] = useState("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"

  const typeCounts = useMemo(() => {
    const counts = new Map();
    for (const item of items) {
      const type = item.word_type || "Other";
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const types = useMemo(() => ["All", ...Array.from(typeCounts.keys()).sort()], [typeCounts]);

  const sorted = useMemo(
    () => sortRows(items, sortField, sortDir, learnedSet),
    [items, sortField, sortDir, learnedSet]
  );

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortHeader({ field, label, className }) {
    const active = sortField === field;
    return (
      <button
        className={`datatable-sort ${active ? "active" : ""} ${className ?? ""}`}
        onClick={() => toggleSort(field)}
      >
        {label}
        {active && <span className="sort-indicator">{sortDir === "asc" ? " ↑" : " ↓"}</span>}
      </button>
    );
  }

  const learnedCount = useMemo(
    () => items.filter((item) => learnedSet.has(item.id)).length,
    [items, learnedSet]
  );

  const activeFilterCount = (activeLevel ? 1 : 0) + (activeKana ? 1 : 0) + (activeType !== "All" ? 1 : 0);
  const filterSummary = [
    activeLevel || null,
    activeKana ? KANA_GROUPS.find((g) => g.key === activeKana)?.kana : null,
    activeType !== "All" ? activeType : null,
  ].filter(Boolean).join(" · ");

  return (
    <section className="vocabulary-section">
      {/* Filter toggle bar */}
      <div className="vocab-filter-bar">
        <button
          type="button"
          className="vocab-filter-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <span className="vocab-filter-toggle-icon">{filtersOpen ? "▾" : "▸"}</span>
          Filters
          {activeFilterCount > 0 && !filtersOpen && (
            <span className="vocab-filter-summary">{filterSummary}</span>
          )}
          {activeFilterCount > 0 && (
            <span className="vocab-filter-badge">{activeFilterCount}</span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="vocab-filter-clear"
            onClick={() => { onLevelChange(""); onKanaChange(""); onTypeChange("All"); }}
          >
            Clear
          </button>
        )}
      </div>

      {filtersOpen && (
        <div className="vocab-filters-body">
          {/* JLPT Level filter */}
          <div className="vocab-filter-group">
            <span className="vocab-filter-label">Level</span>
            <div className="vocab-level-row">
              <button type="button" className={`vocab-level-chip ${!activeLevel ? "active" : ""}`} onClick={() => onLevelChange("")}>All</button>
              {JLPT_LEVELS.map((lvl) => (
                <button key={lvl} type="button" className={`vocab-level-chip ${activeLevel === lvl ? "active" : ""}`} onClick={() => onLevelChange(lvl)}>
                  {lvl}
                  {levelCounts?.[lvl] != null && <span className="vocab-level-count">{levelCounts[lvl].toLocaleString()}</span>}
                </button>
              ))}
              <button type="button" className={`vocab-level-chip ${activeLevel === "none" ? "active" : ""}`} onClick={() => onLevelChange("none")}>
                Unclassified
                {levelCounts?.none != null && <span className="vocab-level-count">{levelCounts.none.toLocaleString()}</span>}
              </button>
            </div>
          </div>

          {/* Kana group filter */}
          <div className="vocab-filter-group">
            <span className="vocab-filter-label">Reading starts with</span>
            <div className="vocab-kana-row">
              <button type="button" className={`vocab-kana-chip ${!activeKana ? "active" : ""}`} onClick={() => onKanaChange("")}>All</button>
              {KANA_GROUPS.map(({ key, kana }) => (
                <button key={key} type="button" className={`vocab-kana-chip ${activeKana === key ? "active" : ""}`} onClick={() => onKanaChange(key)}>{kana}</button>
              ))}
            </div>
          </div>

          {/* Word type filter */}
          <div className="vocab-filter-group">
            <span className="vocab-filter-label">Word type</span>
            <div className="vocabulary-filter-row">
              {types.map((type) => {
                const count = type === "All" ? items.length : (typeCounts.get(type) ?? 0);
                return (
                  <button
                    key={type}
                    type="button"
                    className={`vocabulary-filter-chip ${activeType === type ? "active" : ""}`}
                    onClick={() => onTypeChange(type)}
                  >
                    {type} <span>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary + view toggle */}
      <div className="vocabulary-actions">
        <span className="vocab-summary">
          <strong>{total.toLocaleString()}</strong> words
          {learnedCount > 0 && (
            <> · <span className="vocab-summary-learned">{learnedCount} learned on this page</span></>
          )}
        </span>
        <div className="vocabulary-action-buttons">
          {/* View toggle */}
          <div className="vocab-view-toggle">
            <button
              type="button"
              className={`vocab-view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              ☰ Table
            </button>
            <button
              type="button"
              className={`vocab-view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Card view"
            >
              ⊞ Cards
            </button>
          </div>
        </div>
      </div>

      {/* Card view */}
      {viewMode === "cards" && (
        <VocabCardGrid
          items={sorted}
          learnedSet={learnedSet}
          onSelect={onSelect}
          onToggleLearn={onToggleLearn}
        />
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <div className="vocabulary-table-shell">
          <div className="vocabulary-table-header datatable-header">
            <span className="vocabulary-serial-cell">#</span>
            <span className="vocabulary-checkbox-cell">Done</span>
            <SortHeader field="word" label="Word" />
            <SortHeader field="reading" label="Reading" />
            <SortHeader field="meaning" label="Meaning" />
            <SortHeader field="level" label="Level" />
            <SortHeader field="type" label="Type" />
          </div>

          <div className="vocabulary-table-body">
            {sorted.length === 0 && (
              <div className="vocab-empty">No vocabulary found.</div>
            )}
            {sorted.map((item, index) => (
              <div
                key={item.id ?? item.entSeq ?? `${item.word}-${item.reading}-${offset + index}`}
                className={`vocabulary-row ${learnedSet.has(item.id) ? "learned" : ""}`}
                onClick={() => onToggleLearn(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === " " || e.key === "Enter" ? onToggleLearn(item.id) : undefined}
              >
                <span className="vocabulary-serial-cell">{offset + index + 1}</span>
                <span className="vocabulary-checkbox-cell" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={learnedSet.has(item.id)}
                    onChange={() => onToggleLearn(item.id)}
                    aria-label={`Mark ${item.word} as learned`}
                  />
                </span>
                <span
                  className="vocabulary-word vocabulary-word-link"
                  onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                  title="View details"
                >
                  {item.word}
                </span>
                <span className="vocabulary-reading-cell">{item.reading}</span>
                <span className="vocabulary-meaning-cell">{item.meaning}</span>
                <span className="vocabulary-level-cell">
                  <LevelBadge level={item.level} />
                </span>
                <span className="vocabulary-type-cell">
                  <span className="vocabulary-type-pill">{item.word_type || "Other"}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="vocabulary-pagination">
            <span className="vocab-page-info">
              {total === 0
                ? "No results"
                : `${offset + 1}–${Math.min(offset + limit, total)} of ${total.toLocaleString()}`}
            </span>
            <div className="vocab-page-controls">
              <button
                type="button"
                className="vocab-page-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                ← Prev
              </button>
              <span className="vocab-page-current">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="vocab-page-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
