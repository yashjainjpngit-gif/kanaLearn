function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

export default function PracticeRoundSummary({ roundSummary }) {
  if (!roundSummary?.completed) {
    return null;
  }

  const incorrectAnswers = (roundSummary.answers ?? []).filter((answer) => answer.isCorrect === false);

  return (
    <section className="practice-round-summary">
      <div className="practice-round-summary-header">
        <div>
          <h3>Round Summary</h3>
          <p>
            {roundSummary.correctCount} correct, {roundSummary.incorrectCount} wrong,{" "}
            {formatPercent(roundSummary.accuracyPercent)} accuracy
          </p>
        </div>
      </div>

      <div className="practice-round-summary-grid">
        <article className="practice-round-stat-card">
          <span>Questions</span>
          <strong>{roundSummary.itemCount}</strong>
        </article>
        <article className="practice-round-stat-card">
          <span>Correct</span>
          <strong>{roundSummary.correctCount}</strong>
        </article>
        <article className="practice-round-stat-card">
          <span>Wrong</span>
          <strong>{roundSummary.incorrectCount}</strong>
        </article>
        <article className="practice-round-stat-card">
          <span>Accuracy</span>
          <strong>{formatPercent(roundSummary.accuracyPercent)}</strong>
        </article>
      </div>

      <div className="practice-round-review">
        <h4>Review Mistakes</h4>
        {incorrectAnswers.length ? (
          <div className="practice-round-review-list">
            {incorrectAnswers.map((answer, index) => (
              <article
                key={`${answer.itemId}-${index}`}
                className="practice-round-review-card"
              >
                <strong>{answer.itemLabel}</strong>
                <span>Prompt: {answer.promptValue}</span>
                <span>Your answer: {answer.selectedValue || "—"}</span>
                <span>Expected: {answer.expectedValue}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="practice-round-review-empty">No mistakes in this round.</div>
        )}
      </div>
    </section>
  );
}
