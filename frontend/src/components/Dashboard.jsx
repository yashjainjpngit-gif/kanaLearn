function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

export default function Dashboard({ counts, learnedSummary, kanaSections, practiceSummary }) {
  const moduleCards = [
    ["Kanji", counts.kanji ?? 0, learnedSummary.kanji ?? 0],
    ["Radicals", counts.radicals ?? 0, learnedSummary.radicals ?? 0],
    ["Hiragana", counts.hiragana ?? 0, learnedSummary.hiragana ?? 0],
    ["Katakana", counts.katakana ?? 0, learnedSummary.katakana ?? 0],
    ["Vocabulary", counts.vocabulary ?? 0, learnedSummary.vocabulary ?? 0],
    ["Grammar", counts.grammar ?? 0, learnedSummary.grammar ?? 0],
  ];

  const overviewCards = [
    ["Study Days", learnedSummary.studyDays ?? 0, "days active"],
    ["Rounds", learnedSummary.rounds ?? 0, "saved rounds"],
    ["Answers", learnedSummary.answers ?? 0, "answered prompts"],
    ["Accuracy", formatPercent(learnedSummary.accuracyPercent ?? 0), "overall accuracy"],
  ];

  return (
    <section className="dashboard-shell">
      <div className="dashboard-grid">
        {overviewCards.map(([label, value, meta]) => (
          <article key={label} className="dashboard-card">
            <span className="dashboard-card-label">{label}</span>
            <strong className="dashboard-card-value">{value}</strong>
            <span className="dashboard-card-meta">{meta}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        {moduleCards.map(([label, total, learned]) => (
          <article key={label} className="dashboard-card">
            <span className="dashboard-card-label">{label}</span>
            <strong className="dashboard-card-value">
              {learned} / {total}
            </strong>
            <span className="dashboard-card-meta">
              {total ? formatPercent((learned / total) * 100) : "0%"} learned
            </span>
          </article>
        ))}
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Kana Progress</h3>
            <span>By section</span>
          </div>
          <div className="dashboard-breakdown">
            {kanaSections.map((section) => (
              <article key={section.key} className="dashboard-breakdown-card">
                <strong>{section.label}</strong>
                <span>
                  {section.learned} / {section.total}
                </span>
                <div className="dashboard-progress-bar">
                  <div
                    className="dashboard-progress-fill"
                    style={{ width: `${section.total ? (section.learned / section.total) * 100 : 0}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Practice Stats</h3>
            <span>Saved rounds</span>
          </div>
          <div className="dashboard-breakdown">
            {practiceSummary.byType?.length ? (
              practiceSummary.byType.map((entry) => (
                <article key={entry.studyType} className="dashboard-breakdown-card">
                  <strong>{entry.studyType}</strong>
                  <span>{entry.attempts ?? 0} attempts</span>
                  <span>{formatPercent(entry.accuracyPercent ?? 0)} accuracy</span>
                </article>
              ))
            ) : (
              <article className="dashboard-breakdown-card">
                <strong>No saved practice yet</strong>
                <span>Finish some quiz or flashcard rounds to populate stats.</span>
              </article>
            )}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Weak Items</h3>
            <span>Lowest accuracy</span>
          </div>
          <div className="dashboard-breakdown">
            {practiceSummary.weakItems?.length ? (
              practiceSummary.weakItems.map((entry) => (
                <article key={`${entry.studyType}-${entry.itemId}`} className="dashboard-breakdown-card">
                  <strong>
                    {entry.itemLabel} <span className="dashboard-inline-type">({entry.studyType})</span>
                  </strong>
                  <span>{entry.incorrectAttempts ?? 0} wrong</span>
                  <span>{formatPercent(entry.accuracyPercent ?? 0)} accuracy</span>
                </article>
              ))
            ) : (
              <article className="dashboard-breakdown-card">
                <strong>No weak items yet</strong>
                <span>Finish quizzes to generate mistake data.</span>
              </article>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
