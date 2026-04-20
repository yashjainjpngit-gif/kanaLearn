const BASE_MODES = [
  ["browse", "Browse"],
  ["flashcards", "Flashcards"],
  ["quiz", "Quiz"],
];

export default function PracticeModeSelector({ activeMode, onChange, disabled, activeTab }) {
  const modes =
    activeTab === "vocabulary"
      ? [["learn", "Learn"], ...BASE_MODES]
      : BASE_MODES;

  return (
    <div className="practice-mode-tabs" role="tablist" aria-label="Study mode">
      {modes.map(([mode, label]) => (
        <button
          key={mode}
          type="button"
          className={`practice-mode-tab ${activeMode === mode ? "active" : ""}`}
          onClick={() => onChange(mode)}
          disabled={disabled}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
