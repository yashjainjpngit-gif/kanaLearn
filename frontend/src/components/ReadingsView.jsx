import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAudio from "../utils/useAudio";

const GRAMMAR_PATTERNS = [
  { id: "desu", label: "です", meaning: "polite sentence ending", match: /です/g },
  { id: "masu", label: "ます", meaning: "polite verb ending", match: /ます/g },
  { id: "teiru", label: "ている", meaning: "ongoing state / action", match: /ている/g },
  { id: "tai", label: "たい", meaning: "want to do", match: /たい/g },
  { id: "nai", label: "ない", meaning: "negative form", match: /ない/g },
  { id: "dekiru", label: "できる", meaning: "can do / be able to", match: /できる/g },
  { id: "kara", label: "から", meaning: "because / from", match: /から/g },
  { id: "node", label: "ので", meaning: "because / so", match: /ので/g },
];

function AudioButton({ text, label = "Play" }) {
  const { speak, stop, speaking, supported } = useAudio();
  if (!supported) return null;

  function handleClick() {
    if (speaking) {
      stop();
    } else {
      speak(text);
    }
  }

  return (
    <button
      className={`audio-btn audio-btn-sm ${speaking ? "audio-btn-active" : ""}`}
      onClick={handleClick}
      title={speaking ? "Stop" : `Listen: ${label}`}
      aria-label={speaking ? "Stop audio" : `Listen to ${label}`}
    >
      {speaking ? "■" : "🔊"}
    </button>
  );
}

function detectGrammarHints(text) {
  const source = text ?? "";
  return GRAMMAR_PATTERNS.filter((pattern) => pattern.match.test(source)).map((pattern) => ({
    id: pattern.id,
    label: pattern.label,
    meaning: pattern.meaning,
  }));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlightedParts(text, terms) {
  const source = text ?? "";
  const filteredTerms = [...new Set(terms.filter(Boolean))].sort((left, right) => right.length - left.length);

  if (!source || !filteredTerms.length) {
    return [{ text: source, highlighted: false }];
  }

  const pattern = new RegExp(`(${filteredTerms.map((term) => escapeRegex(term)).join("|")})`, "g");
  return source.split(pattern).filter(Boolean).map((part) => ({
    text: part,
    highlighted: filteredTerms.includes(part),
  }));
}

function buildReadingQuestions(item) {
  const questions = [];
  const vocabItems = item.vocab ?? [];

  if (item.title_en) {
    questions.push({
      id: `${item.id}-topic`,
      question: "What is the main topic of this passage?",
      answer: item.title_en,
    });
  }

  if (vocabItems[0]) {
    questions.push({
      id: `${item.id}-vocab-1`,
      question: `What does "${vocabItems[0].reading}" mean?`,
      answer: vocabItems[0].meaning,
    });
  }

  if (vocabItems[1]) {
    questions.push({
      id: `${item.id}-vocab-2`,
      question: `Which word in this passage matches "${vocabItems[1].meaning}"?`,
      answer: `${vocabItems[1].word} (${vocabItems[1].reading})`,
    });
  }

  return questions.slice(0, 3);
}

export default function ReadingsView({ items, search, auth }) {
  const navigate = useNavigate();
  const [activeLevel, setActiveLevel] = useState("N5");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readingMode, setReadingMode] = useState("hiragana");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showGrammarHelp, setShowGrammarHelp] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const filteredItems = useMemo(() => {
    if (search.trim()) {
      return items.filter((item) => {
        if (sourceFilter === "mine") {
          return item.source === "user";
        }
        if (sourceFilter === "built_in") {
          return item.source !== "user";
        }
        return true;
      });
    }

    return items.filter((item) => {
      const levelMatches = item.level === activeLevel;
      if (!levelMatches) return false;
      if (sourceFilter === "mine") {
        return item.source === "user";
      }
      if (sourceFilter === "built_in") {
        return item.source !== "user";
      }
      return true;
    });
  }, [activeLevel, items, search, sourceFilter]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeLevel, search]);

  useEffect(() => {
    setRevealedAnswers({});
  }, [currentIndex, activeLevel, search]);

  const currentItem = filteredItems[currentIndex] ?? null;

  const grammarHints = useMemo(
    () => detectGrammarHints(currentItem?.reading_text ?? currentItem?.japanese_text ?? ""),
    [currentItem]
  );
  const readingQuestions = useMemo(() => buildReadingQuestions(currentItem ?? {}), [currentItem]);
  const highlightedPassageParts = useMemo(() => {
    const vocab = currentItem?.vocab ?? [];
    const terms = readingMode === "hiragana" ? vocab.map((entry) => entry.reading) : vocab.map((entry) => entry.word);
    const text = readingMode === "hiragana" ? currentItem?.reading_text : currentItem?.japanese_text;
    return buildHighlightedParts(text ?? "", terms);
  }, [currentItem, readingMode]);
  const n5Count = items.filter((item) => item.level === "N5").length;
  const n4Count = items.filter((item) => item.level === "N4").length;

  if (!currentItem) {
    return <div className="grammar-empty">No reading passages found.</div>;
  }

  return (
    <div className="readings-view">
      {!search.trim() ? (
        <div className="reading-header-actions">
          <div className="grammar-level-tabs">
            {[["N5", n5Count], ["N4", n4Count]].map(([level, count]) => (
              <button
                key={level}
                className={`grammar-level-tab ${activeLevel === level ? "active" : ""} grammar-level-tab-${level.toLowerCase()}`}
                onClick={() => setActiveLevel(level)}
              >
                {level}
                <span className="grammar-level-tab-count">{count}</span>
              </button>
            ))}
          </div>
          <div className="reading-source-filter">
            {[
              ["all", "All"],
              ["mine", "Mine"],
              ["built_in", "Built-in"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`reading-toggle-btn ${sourceFilter === value ? "active" : ""}`}
                onClick={() => setSourceFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {auth ? (
            <button type="button" className="secondary-button" onClick={() => navigate("/readings/add")}>
              Add Reading
            </button>
          ) : null}
        </div>
      ) : null}

      <article className="reading-card single-reading-card">
        <div className="reading-card-header">
          <div className="reading-card-title-group">
            <span className="reading-card-title">{currentItem.title_en}</span>
            <span className="reading-progress-copy">
              Passage {currentIndex + 1} of {filteredItems.length}
            </span>
          </div>
          <div className="reading-card-header-right">
            <span className={`grammar-level-pill grammar-level-${currentItem.level?.toLowerCase()}`}>
              {currentItem.level}
            </span>
            <AudioButton text={currentItem.reading_text} label={currentItem.title} />
          </div>
        </div>

        <div className="reading-card-body">
          <div className="reading-toggles">
            <button
              type="button"
              className={`reading-toggle-btn ${readingMode === "hiragana" ? "active" : ""}`}
              onClick={() => setReadingMode("hiragana")}
            >
              Hiragana
            </button>
            <button
              type="button"
              className={`reading-toggle-btn ${readingMode === "original" ? "active" : ""}`}
              onClick={() => setReadingMode("original")}
            >
              Original
            </button>
            <button
              type="button"
              className={`reading-toggle-btn ${showTranslation ? "active" : ""}`}
              onClick={() => setShowTranslation((value) => !value)}
            >
              Translation
            </button>
            <button
              type="button"
              className={`reading-toggle-btn ${showGrammarHelp ? "active" : ""}`}
              onClick={() => setShowGrammarHelp((value) => !value)}
            >
              Grammar Help
            </button>
          </div>

          <p className="reading-hiragana reading-hiragana-only">
            {highlightedPassageParts.map((part, index) => (
              <span
                key={`${part.text}-${index}`}
                className={part.highlighted ? "reading-highlight" : undefined}
              >
                {part.text}
              </span>
            ))}
          </p>

          {showTranslation ? (
            <div className="reading-panel">
              <span className="reading-section-label">Translation</span>
              <p className="reading-english">{currentItem.english_text}</p>
            </div>
          ) : null}

          {showGrammarHelp ? (
            <div className="reading-panel reading-help-panel">
              <div className="reading-help-block">
                <span className="reading-section-label">Grammar Points</span>
                {grammarHints.length ? (
                  <div className="reading-grammar-grid">
                    {grammarHints.map((hint) => (
                      <div key={hint.id} className="reading-grammar-card">
                        <div className="reading-grammar-form">{hint.label}</div>
                        <div className="reading-grammar-meaning">{hint.meaning}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="reading-help-empty">No grammar hints detected for this passage yet.</p>
                )}
              </div>

              <div className="reading-help-block reading-vocab">
                <span className="reading-section-label">Vocabulary Help</span>
                {currentItem.vocab?.length ? (
                  <table className="reading-vocab-table">
                    <thead>
                      <tr>
                        <th>Word</th>
                        <th>Reading</th>
                        <th>Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItem.vocab.map((entry, index) => (
                        <tr key={`${entry.word}-${entry.reading}-${index}`}>
                          <td className="reading-vocab-word">{entry.word}</td>
                          <td className="reading-vocab-reading">{entry.reading}</td>
                          <td className="reading-vocab-meaning">{entry.meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="reading-help-empty">No vocabulary notes for this passage.</p>
                )}
              </div>
            </div>
          ) : null}

          {readingQuestions.length ? (
            <div className="reading-panel">
              <span className="reading-section-label">Comprehension Questions</span>
              <div className="reading-question-list">
                {readingQuestions.map((item) => {
                  const isRevealed = Boolean(revealedAnswers[item.id]);
                  return (
                    <div key={item.id} className="reading-question-card">
                      <div className="reading-question-text">{item.question}</div>
                      {isRevealed ? (
                        <div className="reading-question-answer">{item.answer}</div>
                      ) : (
                        <button
                          type="button"
                          className="reading-answer-btn"
                          onClick={() =>
                            setRevealedAnswers((current) => ({ ...current, [item.id]: true }))
                          }
                        >
                          Show answer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

        </div>

        <div className="single-reading-controls">
          <button
            type="button"
            className="practice-ghost-button"
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="practice-primary-button"
            onClick={() =>
              setCurrentIndex((index) => Math.min(filteredItems.length - 1, index + 1))
            }
            disabled={currentIndex >= filteredItems.length - 1}
          >
            Next
          </button>
        </div>
      </article>
    </div>
  );
}
