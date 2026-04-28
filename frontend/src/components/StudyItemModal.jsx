import { useEffect, useState } from "react";
import { fetchVocabulary } from "../api/kanjiApi";
import useAudio from "../utils/useAudio";
import KanaStrokePlayer from "./KanaStrokePlayer";
import StrokeOrderDiagram from "./StrokeOrderDiagram";

function AudioBtn({ text }) {
  const { speak, stop, speaking, supported } = useAudio();
  if (!supported || !text) return null;
  return (
    <button
      className={`audio-btn audio-btn-md ${speaking ? "audio-btn-active" : ""}`}
      onClick={() => (speaking ? stop() : speak(text))}
      title={speaking ? "Stop" : "Listen"}
    >
      {speaking ? "⏹" : "🔊"}
    </button>
  );
}

/* ── Vocabulary modal (two-panel layout) ── */
function LevelBadge({ level }) {
  if (!level) return null;
  return <span className={`vocab-level-badge vocab-level-${level.toLowerCase()}`}>{level}</span>;
}

function VocabularyModal({ item, isLearned, onClose, onToggleLearn }) {
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : typeof item.tags === "string"
      ? item.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card vocab-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="vocab-modal-body">
          <div className="vocab-modal-left">
            <div className="vocab-modal-word">{item.word}</div>
            <div className="vocab-modal-reading">{item.reading}</div>
            <div className="vocab-modal-meta">
              {item.level && <LevelBadge level={item.level} />}
              {(item.word_type || item.wordType) && (
                <span className="vocabulary-type-pill">{item.word_type || item.wordType}</span>
              )}
              {(item.isCommon || item.is_common) ? (
                <span className="vocab-modal-common">common</span>
              ) : null}
            </div>
          </div>

          <div className="vocab-modal-right">
            <div className="vocab-modal-section-label">Meaning</div>
            <div className="vocab-modal-meaning">{item.meaning}</div>

            {tags.length > 0 && (
              <>
                <div className="vocab-modal-section-label" style={{ marginTop: "14px" }}>Tags</div>
                <div className="vocab-modal-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="vocab-modal-tag">{tag}</span>
                  ))}
                </div>
              </>
            )}

            {(item.senseCount > 1 || item.sense_count > 1) && (
              <div className="vocab-modal-sense-note">
                {item.senseCount || item.sense_count} senses in dictionary
              </div>
            )}
          </div>
        </div>

        <div className="vocab-modal-footer">
          <button
            className={`learned-button ${isLearned ? "learned-active" : ""}`}
            onClick={() => onToggleLearn(item.id)}
          >
            {isLearned ? "✓ Learned" : "Mark as Learned"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Vocabulary slider for kana modal ── */
function KanaVocabSlider({ character }) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchVocabulary({ readingPrefix: character, limit: 8, offset: 0 })
      .then((data) => {
        if (!cancelled) setWords((data.items || []).slice(0, 6));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [character]);

  if (words.length === 0) {
    return <div className="kana-vocab-slider kana-vocab-empty">Loading…</div>;
  }

  const word = words[index];

  return (
    <div className="kana-vocab-slider">
      <div className="kana-vocab-slider-label">Vocabularies</div>
      <div className="kana-vocab-card">
        <div className="kana-vocab-word">{word.word}</div>
        <div className="kana-vocab-reading">{word.reading}</div>
        <div className="kana-vocab-meaning">{word.meaning}</div>
      </div>
      <div className="kana-vocab-nav">
        <button
          className="kana-vocab-arrow"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="Previous"
        >◀</button>
        <span className="kana-vocab-dots">
          {words.map((_, i) => (
            <span
              key={i}
              className={`kana-vocab-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </span>
        <button
          className="kana-vocab-arrow"
          onClick={() => setIndex((i) => Math.min(words.length - 1, i + 1))}
          disabled={index === words.length - 1}
          aria-label="Next"
        >▶</button>
      </div>
    </div>
  );
}

/* ── Kana modal with split top ── */
function KanaModal({ activeTab, item, isLearned, onClose, onToggleLearn }) {
  const isKana = activeTab === "hiragana" || activeTab === "katakana";

  const details = [
    ["Romaji", item.romaji],
    ["Row", item.row_label],
    ["Word", item.example_word],
    ["Reading", item.example_reading],
    ["Meaning", item.example_meaning],
  ].filter(([, v]) => v);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-card ${isKana ? "kana-modal-card" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="kana-modal-top">
          <div className="kana-modal-char-panel">
            <KanaStrokePlayer
              activeTab={activeTab}
              character={item.character_symbol}
              compact
            />
            <h3 className="kana-modal-romaji">{item.romaji}</h3>
            <div className="modal-badges">
              <span className="mini-badge level">{activeTab}</span>
            </div>
          </div>
          {isKana && (
            <KanaVocabSlider character={item.character_symbol} />
          )}
        </div>

        <div className="modal-panel">
          <div className="modal-grid">
            {details.map(([label, value]) => (
              <article className="modal-info-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
        </div>

        <button className="learned-button" onClick={() => onToggleLearn(item.id)}>
          {isLearned ? "Learned" : "Mark as Learned"}
        </button>
      </div>
    </div>
  );
}

/* ── Generic modal (radicals, grammar) ── */
export default function StudyItemModal({ activeTab, item, isLearned, onClose, onToggleLearn }) {
  if (!item) return null;

  if (activeTab === "vocabulary") {
    return <VocabularyModal item={item} isLearned={isLearned} onClose={onClose} onToggleLearn={onToggleLearn} />;
  }

  if (activeTab === "hiragana" || activeTab === "katakana") {
    return <KanaModal activeTab={activeTab} item={item} isLearned={isLearned} onClose={onClose} onToggleLearn={onToggleLearn} />;
  }

  const contentMap = {
    radicals: {
      title: item.symbol,
      subtitle: item.name,
      details: [
        ["Meaning", item.meaning],
        ["Examples", item.example_kanji],
        ["Strokes", item.stroke_count],
        ["Notes", item.notes],
      ],
      example: null,
    },
    grammar: {
      title: item.pattern_name,
      subtitle: item.meaning,
      details: [
        ["Structure", item.structure_text],
        ["Level", item.level],
        ...(item.notes ? [["Notes", item.notes]] : []),
      ],
      example: item.example_japanese
        ? { japanese: item.example_japanese, reading: item.example_reading, meaning: item.example_meaning }
        : null,
    },
    counters: {
      title: item.counter,
      subtitle: item.meaning,
      details: [
        ["Readings", Array.isArray(item.readings) ? item.readings.join(" / ") : item.readings],
        ["Category", item.category],
        ["Applies to", Array.isArray(item.appliesTo) ? item.appliesTo.join(", ") : item.appliesTo],
        ...(item.notes ? [["Notes", item.notes]] : []),
      ],
      example: Array.isArray(item.exampleSentences) && item.exampleSentences.length > 0
        ? { japanese: item.exampleSentences[0].japanese, reading: item.exampleSentences[0].reading, meaning: item.exampleSentences[0].english }
        : null,
    },
  };

  const content = contentMap[activeTab];
  if (!content) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-top">
          <div className="modal-character">{content.title}</div>
          <h3>{content.subtitle}</h3>
          <div className="modal-badges">
            <span className="mini-badge level">{activeTab}</span>
          </div>
        </div>
        <div className="modal-panel">
          <div className="modal-grid">
            {content.details.map(([label, value]) => (
              <article className="modal-info-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          {activeTab === "radicals" && item.symbol && (
            <StrokeOrderDiagram char={item.symbol} />
          )}
          {content.example && (
            <article className="example-card">
              <span>Example</span>
              <div className="example-card-body">
                <div>
                  <p className="example-jp">{content.example.japanese}</p>
                  <p className="example-reading">{content.example.reading}</p>
                  <p className="example-en">{content.example.meaning}</p>
                </div>
                <AudioBtn text={content.example.japanese} />
              </div>
            </article>
          )}
        </div>
        <button className="learned-button" onClick={() => onToggleLearn(item.id)}>
          {isLearned ? "Learned" : "Mark as Learned"}
        </button>
      </div>
    </div>
  );
}
