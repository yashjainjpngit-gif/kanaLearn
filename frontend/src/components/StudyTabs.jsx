import { NavLink } from "react-router-dom";

const TAB_CONFIG = [
  ["dashboard", "Dashboard", "/dashboard"],
  ["challenges", "Challenges", "/challenges"],
  ["radicals", "Radicals", "/radicals"],
  ["hiragana", "Hiragana", "/hiragana"],
  ["katakana", "Katakana", "/katakana"],
  ["kanji", "Kanji", "/kanji"],
  ["vocabulary", "Vocabulary", "/vocabulary"],
  ["grammar", "Grammar", "/grammar"],
  ["counters", "Counters", "/counters"],
  ["readings", "Readings", "/readings"],
  ["conjugator", "Conjugator", "/conjugator"],
];

const HIDE_COUNT = new Set(["dashboard", "challenges", "conjugator"]);

export default function StudyTabs({ counts }) {
  return (
    <div className="study-tabs">
      {TAB_CONFIG.map(([id, label, path]) => (
        <NavLink
          key={id}
          to={path}
          className={({ isActive }) => `study-tab ${isActive ? "active" : ""}`}
        >
          {label} {HIDE_COUNT.has(id) ? null : <span>({counts[id] ?? 0})</span>}
        </NavLink>
      ))}
    </div>
  );
}
