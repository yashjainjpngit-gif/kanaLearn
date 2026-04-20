import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30, 50];
const DEFAULT_GOAL = 10;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadDailyState() {
  try {
    const raw = localStorage.getItem("vocab-daily-state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return null; // new day → reset
    return parsed;
  } catch {
    return null;
  }
}

function saveDailyState(state) {
  try {
    localStorage.setItem("vocab-daily-state", JSON.stringify({ ...state, date: getTodayKey() }));
  } catch {}
}

function loadGoal() {
  try {
    const v = localStorage.getItem("vocab-daily-goal");
    const n = Number(v);
    return DAILY_GOAL_OPTIONS.includes(n) ? n : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
}

function LevelBadge({ level }) {
  if (!level) return null;
  return <span className={`vocab-level-badge vocab-level-${level.toLowerCase()}`}>{level}</span>;
}

export default function VocabLearnMode({ items, learnedSet, onToggleLearn }) {
  const [dailyGoal, setDailyGoal] = useState(loadGoal);
  const [cardIndex, setCardIndex] = useState(0);
  const [romajiVisible, setRomajiVisible] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [sessionDoneIds, setSessionDoneIds] = useState(() => {
    const state = loadDailyState();
    return new Set(state?.doneIds ?? []);
  });

  // Persist goal
  useEffect(() => {
    localStorage.setItem("vocab-daily-goal", String(dailyGoal));
  }, [dailyGoal]);

  // Persist session done IDs
  useEffect(() => {
    saveDailyState({ doneIds: Array.from(sessionDoneIds) });
  }, [sessionDoneIds]);

  // Build today's deck: unlearned first, shuffled, capped at dailyGoal
  const deck = useMemo(() => {
    const unlearned = items.filter((item) => !learnedSet.has(item.id) && !sessionDoneIds.has(item.id));
    const alreadyDoneToday = items.filter((item) => sessionDoneIds.has(item.id));

    // Shuffle unlearned
    const shuffled = [...unlearned];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const remaining = shuffled.slice(0, Math.max(0, dailyGoal - alreadyDoneToday.length));
    return [...alreadyDoneToday, ...remaining];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, learnedSet, dailyGoal]); // intentionally exclude sessionDoneIds to avoid deck rebuild mid-session

  const doneCount = sessionDoneIds.size;
  const totalInDeck = deck.length;
  const goalReached = doneCount >= dailyGoal;

  const safeIndex = Math.min(cardIndex, deck.length - 1);
  const card = deck[safeIndex] ?? null;

  const goNext = useCallback(() => {
    setRomajiVisible(false);
    setCardIndex((i) => Math.min(i + 1, deck.length - 1));
  }, [deck.length]);

  const goPrev = useCallback(() => {
    setRomajiVisible(false);
    setCardIndex((i) => Math.max(i - 1, 0));
  }, []);

  function markDone(id) {
    setSessionDoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    onToggleLearn(id);
    goNext();
  }

  function handleGoalChange(goal) {
    setDailyGoal(goal);
    setShowGoalPicker(false);
    setCardIndex(0);
    setRomajiVisible(false);
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight" || e.key === "l") goNext();
      if (e.key === "ArrowLeft" || e.key === "h") goPrev();
      if (e.key === " " || e.key === "r") { e.preventDefault(); setRomajiVisible((v) => !v); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  if (!items.length) {
    return (
      <div className="vl-empty">
        <p>No vocabulary loaded yet.</p>
      </div>
    );
  }

  return (
    <div className="vl-root">
      {/* Header bar */}
      <div className="vl-header">
        <div className="vl-progress-wrap">
          <span className="vl-progress-label">
            Today&rsquo;s goal
            <strong className="vl-progress-count"> {doneCount} / {dailyGoal}</strong>
          </span>
          <div className="vl-progress-bar">
            <div
              className="vl-progress-fill"
              style={{ width: `${Math.min(100, (doneCount / dailyGoal) * 100)}%` }}
            />
          </div>
        </div>

        <div className="vl-header-right">
          <span className="vl-deck-info">{totalInDeck} in deck</span>
          <div className="vl-goal-picker-wrap">
            <button
              type="button"
              className="vl-goal-btn"
              onClick={() => setShowGoalPicker((v) => !v)}
            >
              Goal: {dailyGoal} ▾
            </button>
            {showGoalPicker && (
              <div className="vl-goal-dropdown">
                <span className="vl-goal-dropdown-label">Daily goal</span>
                {DAILY_GOAL_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`vl-goal-option ${n === dailyGoal ? "active" : ""}`}
                    onClick={() => handleGoalChange(n)}
                  >
                    {n} cards
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal reached banner */}
      {goalReached && (
        <div className="vl-goal-reached">
          <span className="vl-goal-reached-icon">✓</span>
          <span>
            Daily goal reached! Come back tomorrow or keep going.
          </span>
        </div>
      )}

      {/* Card area */}
      {deck.length === 0 ? (
        <div className="vl-empty">
          <p>All vocabulary in the current filter has been learned.</p>
          <p className="vl-empty-sub">Try changing the filter or come back tomorrow.</p>
        </div>
      ) : !card ? null : (
        <>
          <div className="vl-card-area">
            {/* Nav button left */}
            <button
              type="button"
              className="vl-nav-btn vl-nav-prev"
              onClick={goPrev}
              disabled={safeIndex === 0}
              aria-label="Previous card"
            >
              ‹
            </button>

            {/* The card */}
            <div className={`vl-card ${sessionDoneIds.has(card.id) ? "vl-card--done" : ""}`}>
              <div className="vl-card-badges">
                <LevelBadge level={card.level} />
                <span className="vl-card-type">{card.word_type || card.wordType || ""}</span>
                {sessionDoneIds.has(card.id) && (
                  <span className="vl-card-done-badge">✓ Learned</span>
                )}
              </div>

              {/* Kanji / word (may differ from reading) */}
              {card.word !== card.reading && (
                <div className="vl-card-kanji">{card.word}</div>
              )}

              {/* Reading — always shown */}
              <div className="vl-card-reading">{card.reading}</div>

              {/* Meaning */}
              <div className="vl-card-meaning">{card.meaning}</div>

              {/* Romaji — hidden by default */}
              <div className="vl-card-romaji-wrap">
                {romajiVisible ? (
                  <div className="vl-card-romaji">{card.romaji || card.reading}</div>
                ) : (
                  <button
                    type="button"
                    className="vl-reveal-btn"
                    onClick={() => setRomajiVisible(true)}
                  >
                    Show romaji
                  </button>
                )}
              </div>
            </div>

            {/* Nav button right */}
            <button
              type="button"
              className="vl-nav-btn vl-nav-next"
              onClick={goNext}
              disabled={safeIndex >= deck.length - 1}
              aria-label="Next card"
            >
              ›
            </button>
          </div>

          {/* Card counter */}
          <div className="vl-card-counter">
            {safeIndex + 1} / {deck.length}
          </div>

          {/* Action buttons */}
          <div className="vl-actions">
            {!sessionDoneIds.has(card.id) ? (
              <button
                type="button"
                className="vl-mark-btn"
                onClick={() => markDone(card.id)}
              >
                ✓ Mark as learned
              </button>
            ) : (
              <button
                type="button"
                className="vl-unmark-btn"
                onClick={() => {
                  setSessionDoneIds((prev) => {
                    const next = new Set(prev);
                    next.delete(card.id);
                    return next;
                  });
                  onToggleLearn(card.id);
                }}
              >
                ↩ Unmark
              </button>
            )}
          </div>

          {/* Keyboard hints */}
          <div className="vl-hints">
            <span>← → navigate</span>
            <span>Space toggle romaji</span>
          </div>
        </>
      )}
    </div>
  );
}
