import { getKanaRowMeta } from "../utils/kanaRows";

export default function KanaRows({ items, learnedSet, onSelect, onSetRowLearned }) {
  const sectionOrder = [
    ["Basic", ["A-row", "K-row", "S-row", "T-row", "N-row", "H-row", "M-row", "Y-row", "R-row", "W-row", "N-only"]],
    ["Dakuten", ["G-row", "Z-row", "D-row", "B-row"]],
    ["Handakuten", ["P-row"]],
    ["Yoon", ["Kya-row", "Sha-row", "Cha-row", "Nya-row", "Hya-row", "Mya-row", "Rya-row", "Gya-row", "Ja-row", "Bya-row", "Pya-row"]],
  ];

  const grouped = items.reduce((accumulator, item) => {
    const { label, order } = getKanaRowMeta(item);
    const key = `${order}-${label}`;
    if (!accumulator[key]) {
      accumulator[key] = {
        rowLabel: label,
        rowOrder: order,
        items: [],
      };
    }
    accumulator[key].items.push(item);
    return accumulator;
  }, {});

  const rows = Object.values(grouped)
    .sort((left, right) => left.rowOrder - right.rowOrder)
    .map((row) => ({
      ...row,
      items: row.items.sort((left, right) => left.column_order - right.column_order),
    }));

  const sections = sectionOrder
    .map(([title, labels]) => ({
      title,
      rows: rows.filter((row) => labels.includes(row.rowLabel)),
    }))
    .filter((section) => section.rows.length > 0);

  return (
    <section className="kana-card-rows">
      {sections.map((section) => (
        <div className="kana-section" key={section.title}>
          <div className="kana-section-title">
            {section.title} <span>({section.rows.reduce((total, row) => total + row.items.length, 0)})</span>
          </div>
          {section.rows.map((row) => (
            <div className="kana-card-row" key={row.rowLabel}>
              <div className="kana-card-row-header">
                <div className="kana-card-row-label">{row.rowLabel}</div>
                <button
                  type="button"
                  className="kana-row-action"
                  onClick={() =>
                    onSetRowLearned?.(
                      row.items.map((item) => item.id),
                      !row.items.every((item) => learnedSet.has(item.id))
                    )
                  }
                >
                  {row.items.every((item) => learnedSet.has(item.id)) ? "Mark row new" : "Mark row done"}
                </button>
              </div>
              <div className={`kana-card-grid ${row.items.length <= 3 ? "compact" : ""}`}>
                {row.items.map((item) => (
                  <button
                    key={item.id}
                    className={`module-card kana-character-card ${learnedSet.has(item.id) ? "learned" : ""}`}
                    onClick={() => onSelect(item)}
                  >
                    <div className="module-card-top">
                      <span className="module-type">kana</span>
                    </div>
                    <div className="kana-character-main">{item.character_symbol}</div>
                    <div className="kana-character-romaji">{item.romaji}</div>
                    <div className="kana-character-meta">{row.rowLabel}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
