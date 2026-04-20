import { useState } from "react";

export default function KanaRowFilter({ rowOptions, selectedRows, onToggleRow, onClear }) {
  const [collapsed, setCollapsed] = useState(true);

  if (!rowOptions.length) {
    return null;
  }

  return (
    <div className="kana-filter-shell">
      <div className="kana-filter-header">
        <button
          type="button"
          className="kana-filter-toggle"
          onClick={() => setCollapsed((value) => !value)}
        >
          <span className="kana-filter-title">Kana Rows</span>
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
        {!collapsed ? (
          <button
            type="button"
            className="kana-filter-clear"
            onClick={onClear}
            disabled={!selectedRows.length}
          >
            Clear
          </button>
        ) : null}
      </div>
      {!collapsed ? (
        <div className="kana-filter-row">
          {rowOptions.map((row) => (
            <label
              key={row.value}
              className={`kana-filter-chip ${selectedRows.includes(row.value) ? "active" : ""}`}
            >
              <input
                type="checkbox"
                checked={selectedRows.includes(row.value)}
                onChange={() => onToggleRow(row.value)}
              />
              <span>
                {row.label} <strong>({row.count})</strong>
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
