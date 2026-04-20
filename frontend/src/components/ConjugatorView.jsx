import { useEffect, useMemo, useState } from "react";
import { fetchVocabulary } from "../api/kanjiApi";
import { conjugate } from "../utils/conjugator";
import useAudio from "../utils/useAudio";

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function AudioButton({ text }) {
  const { speak, stop, speaking, supported } = useAudio();
  if (!supported) return null;
  return (
    <button
      className={`audio-btn audio-btn-sm ${speaking ? "audio-btn-active" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        if (speaking) stop();
        else speak(text);
      }}
      aria-label="Play audio"
    >
      {speaking ? "⏹" : "🔊"}
    </button>
  );
}

function MatchCard({ item, selected, onSelect }) {
  const subtitle = [item.wordType, item.level].filter(Boolean).join(" · ");
  return (
    <button
      className={`conjugator-match ${selected ? "selected" : ""}`}
      onClick={() => onSelect(item)}
      type="button"
    >
      <div className="conjugator-match-top">
        <span className="conjugator-match-word">{item.word}</span>
        {item.reading && item.reading !== item.word && (
          <span className="conjugator-match-reading">{item.reading}</span>
        )}
      </div>
      <div className="conjugator-match-meaning">{item.meaning}</div>
      <div className="conjugator-match-meta">{subtitle}</div>
    </button>
  );
}

export default function ConjugatorView() {
  const [input, setInput] = useState("");
  const debounced = useDebouncedValue(input.trim(), 300);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!debounced) {
      setMatches([]);
      setSelected(null);
      setError(null);
      return undefined;
    }
    setLoading(true);
    setError(null);
    fetchVocabulary({ search: debounced, limit: 20 })
      .then((data) => {
        if (ignore) return;
        const items = (data.items ?? []).filter((item) => {
          const t = item.wordType;
          return t === "Verb" || t === "Adjective";
        });
        setMatches(items);
        setSelected(items[0] ?? null);
        setManualMode(items.length === 0);
      })
      .catch((err) => {
        if (!ignore) setError(err.message ?? String(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [debounced]);

  const result = useMemo(() => {
    if (selected) {
      return conjugate({ word: selected.word, reading: selected.reading, tags: selected.tags ?? [] });
    }
    if (manualMode && debounced) {
      return conjugate({ word: debounced, reading: debounced, tags: [] });
    }
    return null;
  }, [selected, manualMode, debounced]);

  function renderFormCell(formObj, key) {
    if (!formObj) return null;
    const { kana, kanji } = formObj;
    const primary = kanji || kana;
    return (
      <td key={key} className="conjugator-form-cell">
        <div className="conjugator-form-row">
          <span className="conjugator-form-primary">{primary}</span>
          <AudioButton text={primary} />
        </div>
        {kanji && kanji !== kana && (
          <div className="conjugator-form-reading">{kana}</div>
        )}
      </td>
    );
  }

  return (
    <div className="conjugator-view">
      <div className="conjugator-input-row">
        <input
          type="text"
          className="conjugator-input"
          placeholder="Type a verb or adjective (e.g. 飲む, たべる, 高い, きれい)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        {loading && <span className="conjugator-loading">Searching…</span>}
      </div>

      {error && <div className="conjugator-error">Error: {error}</div>}

      {matches.length > 1 && (
        <div className="conjugator-matches">
          <div className="conjugator-matches-label">Pick a match:</div>
          <div className="conjugator-matches-list">
            {matches.map((item) => (
              <MatchCard
                key={item.id}
                item={item}
                selected={selected?.id === item.id}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>
      )}

      {manualMode && debounced && (
        <div className="conjugator-notice">
          No dictionary match — trying a heuristic conjugation based on the ending.
        </div>
      )}

      {result && result.error && (
        <div className="conjugator-error">{result.error}</div>
      )}

      {result && result.forms && (
        <div className="conjugator-result">
          <div className="conjugator-header">
            <div className="conjugator-header-left">
              <span className="conjugator-header-word">
                {selected?.word || debounced}
              </span>
              {selected?.reading && selected.reading !== selected.word && (
                <span className="conjugator-header-reading">{selected.reading}</span>
              )}
              <span className="conjugator-header-group">{result.group}</span>
            </div>
            {selected?.meaning && (
              <div className="conjugator-header-meaning">{selected.meaning}</div>
            )}
          </div>

          <div className="conjugator-sections">
            {result.sections.map((section) => {
              const rows = section.keys.filter((k) => result.forms[k]);
              if (!rows.length) return null;
              return (
                <div key={section.title} className="conjugator-section">
                  <div className="conjugator-section-title">{section.title}</div>
                  <table className="conjugator-table">
                    <tbody>
                      {rows.map((k) => (
                        <tr key={k}>
                          <th className="conjugator-form-label">{k}</th>
                          {renderFormCell(result.forms[k], k)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!input && (
        <div className="conjugator-hint">
          <div className="conjugator-hint-title">How it works</div>
          <ul>
            <li>Type a verb (食べる, 飲む, する, 来る) or adjective (高い, きれい) — kanji or kana.</li>
            <li>Pick a match if there are several. We use JMdict POS tags to pick the right group.</li>
            <li>All conjugations are generated offline by rules — no external API call.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
