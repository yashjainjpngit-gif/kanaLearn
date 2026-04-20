import { useEffect, useMemo, useState } from "react";
import {
  getPracticeItemLabel,
  getPracticeValue,
  normalizePracticeInput,
} from "./practiceUtils";
import KanaDrawPractice from "./KanaDrawPractice";

function shuffleItems(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }

  return shuffled;
}

function buildChoices(items, currentItem, activeTab, answerMode) {
  const otherItems = shuffleItems(items.filter((item) => item.id !== currentItem.id));
  const seenValues = new Set([getPracticeValue(currentItem, activeTab, answerMode)]);
  const choices = [currentItem];

  for (const item of otherItems) {
    const value = getPracticeValue(item, activeTab, answerMode);
    if (!value || seenValues.has(value)) {
      continue;
    }

    choices.push(item);
    seenValues.add(value);

    if (choices.length === 9) {
      break;
    }
  }

  return shuffleItems(choices);
}

function buildQuestions(items, activeTab, quizMode, promptMode, answerMode) {
  if (quizMode === "combo_typing" && (activeTab === "hiragana" || activeTab === "katakana")) {
    const shuffled = shuffleItems(items);

    return items.map((item, index) => {
      const comboSize = Math.min(2 + (index % 3), shuffled.length);
      const comboItems = [];

      for (let offset = 0; offset < comboSize; offset += 1) {
        comboItems.push(shuffled[(index + offset) % shuffled.length]);
      }

      return {
        type: "combo_typing",
        item,
        itemId: item.id,
        itemLabel: comboItems.map((entry) => entry.character_symbol).join(""),
        promptValue: comboItems.map((entry) => getPracticeValue(entry, activeTab, promptMode)).join(""),
        expectedValue: comboItems.map((entry) => getPracticeValue(entry, activeTab, answerMode)).join(""),
        choices: [],
      };
    });
  }

  if (quizMode === "typing") {
    return items.map((item) => ({
      type: "typing",
      item,
      itemId: item.id,
      itemLabel: getPracticeItemLabel(item, activeTab),
      promptValue: getPracticeValue(item, activeTab, promptMode),
      expectedValue: getPracticeValue(item, activeTab, answerMode),
      choices: [],
    }));
  }

  return items.map((item) => ({
    type: "multiple_choice",
    item,
    itemId: item.id,
    itemLabel: getPracticeItemLabel(item, activeTab),
    promptValue: getPracticeValue(item, activeTab, promptMode),
    expectedValue: getPracticeValue(item, activeTab, answerMode),
    choices: buildChoices(items, item, activeTab, answerMode),
  }));
}

export default function QuizPractice({
  activeTab,
  items,
  quizMode,
  promptMode,
  answerMode,
  roundKey,
  onProgress,
  onComplete,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersByIndex, setAnswersByIndex] = useState({});
  const [typedValue, setTypedValue] = useState("");

  const questions = useMemo(
    () => buildQuestions(items, activeTab, quizMode, promptMode, answerMode),
    [activeTab, answerMode, items, promptMode, quizMode, roundKey]
  );

  useEffect(() => {
    setCurrentIndex(0);
    setAnswersByIndex({});
    setTypedValue("");
  }, [promptMode, answerMode, quizMode, roundKey]);

  const currentQuestion = questions[currentIndex];
  const currentItem = currentQuestion?.item;

  const score = useMemo(() => {
    const answers = Object.values(answersByIndex);
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const incorrectCount = answers.filter((answer) => answer.isCorrect === false).length;

    return {
      answeredCount: answers.length,
      correctCount,
      incorrectCount,
    };
  }, [answersByIndex]);

  useEffect(() => {
    onProgress?.({
      currentIndex,
      itemCount: questions.length,
      ...score,
    });
  }, [currentIndex, onProgress, questions.length, score]);

  useEffect(() => {
    const currentAnswer = answersByIndex[currentIndex];
    setTypedValue(currentAnswer?.selectedValue ?? "");
  }, [answersByIndex, currentIndex]);

  if (!questions.length || !currentQuestion || !currentItem) {
    return null;
  }

  const selectedAnswer = answersByIndex[currentIndex];
  const isTypingMode = quizMode === "typing" || quizMode === "combo_typing";
  const isDrawMode = quizMode === "draw";

  function saveAnswer(answer) {
    setAnswersByIndex((current) => ({
      ...current,
      [currentIndex]: answer,
    }));
  }

  function handleChoiceAnswer(choice) {
    const selectedValue = getPracticeValue(choice, activeTab, answerMode);
    saveAnswer({
      itemId: currentQuestion.itemId,
      itemLabel: currentQuestion.itemLabel,
      promptValue: currentQuestion.promptValue,
      expectedValue: currentQuestion.expectedValue,
      selectedValue,
      isCorrect: choice.id === currentItem.id,
      selectedId: choice.id,
    });
  }

  function handleTypedSubmit() {
    const selectedValue = typedValue.trim();
    if (!selectedValue) {
      return;
    }

    saveAnswer({
      itemId: currentQuestion.itemId,
      itemLabel: currentQuestion.itemLabel,
      promptValue: currentQuestion.promptValue,
      expectedValue: currentQuestion.expectedValue,
      selectedValue,
      isCorrect:
        normalizePracticeInput(selectedValue) ===
        normalizePracticeInput(currentQuestion.expectedValue),
    });
  }

  function handleDrawResult(isCorrect, selectedValue) {
    saveAnswer({
      itemId: currentQuestion.itemId,
      itemLabel: currentQuestion.itemLabel,
      promptValue: currentQuestion.promptValue,
      expectedValue: currentQuestion.expectedValue,
      selectedValue,
      isCorrect,
    });
  }

  function goToNext() {
    if (currentIndex >= questions.length - 1) {
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function goToPrevious() {
    if (currentIndex === 0) {
      return;
    }

    setCurrentIndex((index) => index - 1);
  }

  function finishRound() {
    const answeredCount = Object.keys(answersByIndex).length;
    const accuracyPercent = answeredCount ? (score.correctCount / answeredCount) * 100 : 0;

    onComplete?.({
      itemCount: questions.length,
      correctCount: score.correctCount,
      incorrectCount: score.incorrectCount,
      accuracyPercent,
      answers: questions.map((question, index) => {
        const answer = answersByIndex[index];

        return {
          itemId: question.itemId,
          itemLabel: question.itemLabel,
          promptValue: question.promptValue,
          expectedValue: question.expectedValue,
          selectedValue: answer?.selectedValue ?? null,
          isCorrect: answer?.isCorrect ?? false,
        };
      }),
    });
  }

  function handleTypingKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!selectedAnswer) {
      handleTypedSubmit();
      return;
    }

    if (currentIndex < questions.length - 1) {
      goToNext();
    } else {
      finishRound();
    }
  }

  return (
    <section className="quiz-layout">
      <div className="quiz-prompt-panel">
        <div className="practice-player-top">
          <span>
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span>
            {promptMode} → {answerMode}
          </span>
        </div>

        <div className={`quiz-prompt-value ${activeTab}`}>{currentQuestion.promptValue}</div>

        <div className="quiz-mode-row">
          <span className="practice-radio active">{promptMode}</span>
          <span className="practice-radio">{answerMode}</span>
          {quizMode !== "multiple_choice" ? (
            <span className="practice-radio">
              {quizMode === "combo_typing" ? "combo" : quizMode === "draw" ? "draw" : "typing"}
            </span>
          ) : null}
        </div>

        <div className="quiz-score-strip">
          <span>Correct {score.correctCount}</span>
          <span>Wrong {score.incorrectCount}</span>
          <span>Answered {score.answeredCount}</span>
        </div>
      </div>

      <div className="quiz-answer-panel">
        {isDrawMode ? (
          <KanaDrawPractice
            promptValue={currentQuestion.promptValue}
            expectedValue={currentQuestion.expectedValue}
            activeTab={activeTab}
            answered={Boolean(selectedAnswer)}
            result={selectedAnswer}
            onSubmitResult={handleDrawResult}
          />
        ) : isTypingMode ? (
          <div className="typing-quiz-panel">
            <div className="typing-quiz-copy">
              Type the {answerMode === "character" ? "kana" : "romaji"} answer and press Enter.
            </div>
            <input
              className="typing-quiz-input"
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              onKeyDown={handleTypingKeyDown}
              placeholder={answerMode === "character" ? "Type kana" : "Type romaji"}
            />
            <div className="typing-quiz-actions">
              <button
                type="button"
                className="practice-primary-button"
                onClick={handleTypedSubmit}
                disabled={!typedValue.trim() || Boolean(selectedAnswer)}
              >
                Check Answer
              </button>
            </div>
            {selectedAnswer ? (
              <div className={`typing-quiz-feedback ${selectedAnswer.isCorrect ? "correct" : "wrong"}`}>
                <strong>{selectedAnswer.isCorrect ? "Correct" : "Not correct"}</strong>
                <span>Expected: {currentQuestion.expectedValue}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="quiz-grid">
            {currentQuestion.choices.map((choice) => {
              const isSelected = selectedAnswer?.selectedId === choice.id;
              const isCorrect = selectedAnswer && choice.id === currentItem.id;
              const isWrong = isSelected && choice.id !== currentItem.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`quiz-choice ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                  onClick={() => handleChoiceAnswer(choice)}
                >
                  {getPracticeValue(choice, activeTab, answerMode)}
                </button>
              );
            })}
          </div>
        )}

        <div className="practice-player-controls quiz-controls">
          <button
            type="button"
            className="practice-icon-button"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            ←
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              className="practice-primary-button"
              onClick={goToNext}
              disabled={!selectedAnswer}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="practice-primary-button"
              onClick={finishRound}
              disabled={Object.keys(answersByIndex).length !== questions.length}
            >
              Finish Round
            </button>
          )}

          <button
            type="button"
            className="practice-icon-button"
            onClick={goToNext}
            disabled={currentIndex >= questions.length - 1 || !selectedAnswer}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
