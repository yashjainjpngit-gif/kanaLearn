export default function PracticeSetup({
  activeTab,
  availableCount,
  sourceMode,
  onSourceModeChange,
  groupOptions,
  selectedGroups,
  onToggleGroup,
  flashcardModes,
  flashcardMode,
  onFlashcardModeChange,
  promptModes,
  promptMode,
  onPromptModeChange,
  answerModes,
  answerMode,
  onAnswerModeChange,
  quizModes,
  quizMode,
  onQuizModeChange,
  practiceCount,
  onPracticeCountChange,
  onShuffle,
  onStartRound,
  viewMode,
  collapsed,
  onToggleCollapsed,
  roundSummary,
}) {
  const countOptions = [...new Set([5, 10, 20, availableCount].filter((count) => count > 0 && count <= availableCount))];
  const readyCount = Math.min(practiceCount, availableCount);
  const sourceOptions = [
    ["all", "All"],
    ["mistakes", "Mistakes only"],
    ["learned", "Learned only"],
    ["unlearned", "Unlearned only"],
  ];

  return (
    <section className={`practice-setup ${collapsed ? "collapsed" : ""}`}>
      <div className="practice-setup-header">
        <div>
          <h3>Practice Setup</h3>
          <p>Choose exactly what to test, then start a focused round.</p>
        </div>
        <div className="practice-setup-actions">
          <button type="button" className="practice-ghost-button" onClick={onShuffle} disabled={!availableCount}>
            Shuffle
          </button>
          <button type="button" className="practice-ghost-button" onClick={onToggleCollapsed}>
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      <div className="practice-summary-banner">
        <span>
          {availableCount ? (
            <>
              Ready: <strong>{readyCount}</strong> {activeTab} items
            </>
          ) : (
            "No items match the current selection."
          )}
        </span>
        {roundSummary ? (
          <span>
            Score: <strong>{roundSummary.correctCount}</strong> / {roundSummary.itemCount}
          </span>
        ) : null}
      </div>

      {!collapsed ? (
        <>
          {groupOptions.length ? (
            <div className="practice-field">
              <span className="practice-label">Sections</span>
              <div className="practice-checkbox-group">
                {groupOptions.map((group) => (
                  <label
                    key={group.value}
                    className={`practice-checkbox-card ${selectedGroups.includes(group.value) ? "active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.value)}
                      onChange={() => onToggleGroup(group.value)}
                    />
                    <span className="practice-checkbox-text">
                      {group.label} <span>({group.count})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="practice-setup-grid">
            <div className="practice-field">
              <span className="practice-label">Source</span>
              <div className="practice-chip-group">
                {sourceOptions.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`practice-chip ${sourceMode === value ? "active" : ""}`}
                    onClick={() => onSourceModeChange(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="practice-field">
              <span className="practice-label">Question Count</span>
              <div className="practice-chip-group">
                {countOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`practice-chip ${practiceCount === count ? "active" : ""}`}
                    onClick={() => onPracticeCountChange(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {viewMode === "flashcards" ? (
              <div className="practice-field">
                <span className="practice-label">Card Mode</span>
                <div className="practice-chip-group">
                  {flashcardModes.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      className={`practice-chip ${flashcardMode === mode.value ? "active" : ""}`}
                      onClick={() => onFlashcardModeChange(mode.value)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {viewMode === "quiz" ? (
              <>
                {quizModes?.length ? (
                  <div className="practice-field">
                    <span className="practice-label">Quiz Type</span>
                    <div className="practice-chip-group">
                      {quizModes.map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          className={`practice-chip ${quizMode === mode.value ? "active" : ""}`}
                          onClick={() => onQuizModeChange(mode.value)}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="practice-field">
                  <span className="practice-label">Prompt Mode</span>
                  <div className="practice-chip-group">
                    {promptModes.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        className={`practice-chip ${promptMode === mode.value ? "active" : ""}`}
                        onClick={() => onPromptModeChange(mode.value)}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {quizMode === "draw" ? (
                  <div className="practice-field">
                    <span className="practice-label">Answer Mode</span>
                    <div className="practice-static-note">Draw mode checks the kana character on the canvas.</div>
                  </div>
                ) : (
                  <div className="practice-field">
                    <span className="practice-label">Answer Mode</span>
                    <div className="practice-chip-group">
                      {answerModes.map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          className={`practice-chip ${answerMode === mode.value ? "active" : ""}`}
                          onClick={() => onAnswerModeChange(mode.value)}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="practice-setup-footer">
            <button
              type="button"
              className="practice-primary-button"
              onClick={onStartRound}
              disabled={!availableCount}
            >
              Start Round
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
