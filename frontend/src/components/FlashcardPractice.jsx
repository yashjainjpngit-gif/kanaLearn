import { useEffect, useMemo, useState } from "react";
import { getFlashcardFaces, getPracticeItemLabel } from "./practiceUtils";

export default function FlashcardPractice({
  activeTab,
  items,
  flashcardMode,
  roundKey,
  onProgress,
  onComplete,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBackVisible, setIsBackVisible] = useState(false);
  const [reviewedIndexes, setReviewedIndexes] = useState([]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsBackVisible(false);
    setReviewedIndexes([]);
  }, [items, flashcardMode, roundKey]);

  const currentItem = items[currentIndex];
  const faces = useMemo(
    () => (currentItem ? getFlashcardFaces(currentItem, activeTab, flashcardMode) : null),
    [activeTab, currentItem, flashcardMode]
  );

  useEffect(() => {
    onProgress?.({
      currentIndex,
      itemCount: items.length,
      answeredCount: reviewedIndexes.length,
      correctCount: 0,
      incorrectCount: 0,
    });
  }, [currentIndex, items.length, onProgress, reviewedIndexes.length]);

  if (!items.length || !currentItem || !faces) {
    return null;
  }

  function handleFlip() {
    setIsBackVisible((value) => {
      const nextValue = !value;

      if (nextValue) {
        setReviewedIndexes((current) =>
          current.includes(currentIndex) ? current : [...current, currentIndex]
        );
      }

      return nextValue;
    });
  }

  function goToNext() {
    if (currentIndex >= items.length - 1) {
      return;
    }

    setCurrentIndex((index) => index + 1);
    setIsBackVisible(false);
  }

  function goToPrevious() {
    if (currentIndex === 0) {
      return;
    }

    setCurrentIndex((index) => index - 1);
    setIsBackVisible(false);
  }

  function finishRound() {
    onComplete?.({
      itemCount: items.length,
      correctCount: 0,
      incorrectCount: 0,
      accuracyPercent: 0,
      answers: items.map((item) => {
        const itemFaces = getFlashcardFaces(item, activeTab, flashcardMode);

        return {
          itemId: item.id,
          itemLabel: getPracticeItemLabel(item, activeTab),
          promptValue: itemFaces.front,
          expectedValue: itemFaces.back,
          selectedValue: null,
          isCorrect: null,
        };
      }),
    });
  }

  return (
    <section className="practice-player">
      <div className="practice-card-shell">
        <div className="practice-player-top">
          <span>
            Card {currentIndex + 1} / {items.length}
          </span>
          <span>{flashcardMode.replaceAll("_", " ")}</span>
        </div>

        <button type="button" className="flashcard-surface" onClick={handleFlip}>
          <div className={`flashcard-rotator ${isBackVisible ? "is-flipped" : ""}`}>
            <div className={`flashcard-face flashcard-front ${activeTab}`}>{faces.front}</div>
            <div className={`flashcard-face flashcard-back ${activeTab}`}>{faces.back}</div>
          </div>
        </button>

        <div className="practice-player-footer">
          Click the card to {isBackVisible ? "show the front" : "flip to the answer"}
        </div>
      </div>

      <div className="practice-player-controls">
        <button type="button" className="practice-icon-button" onClick={goToPrevious} disabled={currentIndex === 0}>
          ←
        </button>
        <button type="button" className="practice-primary-button" onClick={handleFlip}>
          {isBackVisible ? "Show Front" : "Flip Card"}
        </button>
        {currentIndex < items.length - 1 ? (
          <button type="button" className="practice-icon-button" onClick={goToNext}>
            →
          </button>
        ) : (
          <button type="button" className="practice-primary-button" onClick={finishRound}>
            Finish Round
          </button>
        )}
      </div>
    </section>
  );
}
