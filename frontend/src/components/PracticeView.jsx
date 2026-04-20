import FlashcardPractice from "./FlashcardPractice";
import PracticeRoundSummary from "./PracticeRoundSummary";
import PracticeSetup from "./PracticeSetup";
import QuizPractice from "./QuizPractice";

export default function PracticeView({
  activeTab,
  activePracticeItems,
  flashcardMode,
  groupOptions,
  handleAnswerModeChange,
  handlePromptModeChange,
  handleQuizModeChange,
  handleRoundComplete,
  handleRoundProgress,
  handleShuffleRound,
  handleStartRound,
  practiceCount,
  practiceGroups,
  practiceModeConfig,
  practiceRoundKey,
  practiceSetupCollapsed,
  practiceSourceItems,
  practiceSourceMode,
  progressSummary,
  quizAnswerMode,
  quizMode,
  quizPromptMode,
  roundSummary,
  savingSession,
  setFlashcardMode,
  setPracticeCount,
  setPracticeSourceMode,
  setPracticeSetupCollapsed,
  togglePracticeGroup,
  viewMode,
}) {
  return (
    <>
      <section className="practice-shell">
        <PracticeSetup
          activeTab={activeTab}
          availableCount={practiceSourceItems.length}
          sourceMode={practiceSourceMode}
          onSourceModeChange={setPracticeSourceMode}
          groupOptions={groupOptions}
          selectedGroups={practiceGroups}
          onToggleGroup={togglePracticeGroup}
          flashcardModes={practiceModeConfig.flashcardModes}
          flashcardMode={flashcardMode}
          onFlashcardModeChange={setFlashcardMode}
          promptModes={practiceModeConfig.promptModes}
          promptMode={quizPromptMode}
          onPromptModeChange={handlePromptModeChange}
          answerModes={practiceModeConfig.answerModes}
          answerMode={quizAnswerMode}
          onAnswerModeChange={handleAnswerModeChange}
          quizModes={practiceModeConfig.quizModes}
          quizMode={quizMode}
          onQuizModeChange={handleQuizModeChange}
          practiceCount={practiceCount}
          onPracticeCountChange={setPracticeCount}
          onShuffle={handleShuffleRound}
          onStartRound={handleStartRound}
          viewMode={viewMode}
          collapsed={practiceSetupCollapsed}
          onToggleCollapsed={() => setPracticeSetupCollapsed((value) => !value)}
          roundSummary={roundSummary}
        />

        {roundSummary || progressSummary ? (
          <section className="practice-status-bar">
            <div className="practice-status-group">
              <span className="practice-status-label">Round</span>
              <strong>
                {roundSummary?.answeredCount ?? 0}/{roundSummary?.itemCount ?? 0}
              </strong>
            </div>
            <div className="practice-status-group">
              <span className="practice-status-label">Score</span>
              <strong>{roundSummary?.correctCount ?? 0} correct</strong>
            </div>
            <div className="practice-status-group">
              <span className="practice-status-label">Accuracy</span>
              <strong>{Math.round(roundSummary?.accuracyPercent ?? 0)}%</strong>
            </div>
            <div className="practice-status-group">
              <span className="practice-status-label">Lifetime Attempts</span>
              <strong>{progressSummary?.attempts ?? 0}</strong>
            </div>
            <div className="practice-status-group">
              <span className="practice-status-label">Saved</span>
              <strong>{savingSession ? "Saving..." : "Synced"}</strong>
            </div>
          </section>
        ) : null}
      </section>

      {activePracticeItems.length ? (
        viewMode === "flashcards" ? (
          <FlashcardPractice
            activeTab={activeTab}
            items={activePracticeItems}
            flashcardMode={flashcardMode}
            roundKey={practiceRoundKey}
            onProgress={handleRoundProgress}
            onComplete={handleRoundComplete}
          />
        ) : (
          <QuizPractice
            activeTab={activeTab}
            items={activePracticeItems}
            quizMode={quizMode}
            promptMode={quizPromptMode}
            answerMode={quizAnswerMode}
            roundKey={practiceRoundKey}
            onProgress={handleRoundProgress}
            onComplete={handleRoundComplete}
          />
        )
      ) : (
        <section className="practice-placeholder">
          <h3>Set up a round</h3>
          <p>Choose your filters and click `Start Round`.</p>
        </section>
      )}

      <PracticeRoundSummary roundSummary={roundSummary} />
    </>
  );
}
