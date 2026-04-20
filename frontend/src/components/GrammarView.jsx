import { useMemo, useState } from "react";
import useAudio from "../utils/useAudio";

// ── Audio button ────────────────────────────────────────────────────────────
function AudioButton({ text, label = "Play", size = "sm" }) {
  const { speak, stop, speaking, supported } = useAudio();
  if (!supported) return null;

  function handleClick(e) {
    e.stopPropagation();
    if (speaking) {
      stop();
    } else {
      speak(text);
    }
  }

  return (
    <button
      className={`audio-btn audio-btn-${size} ${speaking ? "audio-btn-active" : ""}`}
      onClick={handleClick}
      title={speaking ? "Stop" : `Listen: ${label}`}
      aria-label={speaking ? "Stop audio" : `Listen to ${label}`}
    >
      {speaking ? "⏹" : "🔊"}
    </button>
  );
}

// ── Level pill ───────────────────────────────────────────────────────────────
function LevelPill({ level }) {
  return (
    <span className={`grammar-level-pill grammar-level-${level?.toLowerCase()}`}>{level}</span>
  );
}

// ── Notes renderer ───────────────────────────────────────────────────────────
// Parses structured notes text (■ sections, ・ bullets, ※ asides, → conjugations)
// into visual blocks rather than a single gray paragraph.
function NotesRenderer({ text }) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);

  function renderLine(line, key) {
    const trimmed = line.trimStart();
    if (!trimmed) return null;
    if (trimmed.startsWith("・") || trimmed.startsWith("•")) {
      return (
        <div key={key} className="grammar-notes-bullet">
          {trimmed.slice(1).trimStart()}
        </div>
      );
    }
    if (trimmed.startsWith("※")) {
      return (
        <div key={key} className="grammar-notes-aside">
          {trimmed.slice(1).trimStart()}
        </div>
      );
    }
    // Numbered list: "1. ", "2. " etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={key} className="grammar-notes-numbered">
          <span className="grammar-notes-num">{numMatch[1]}.</span>
          <span>{numMatch[2]}</span>
        </div>
      );
    }
    // Lines that look like conjugation tables: contain an arrow
    if (trimmed.includes("→") && !trimmed.endsWith(":")) {
      return (
        <div key={key} className="grammar-notes-conj">
          {trimmed}
        </div>
      );
    }
    return (
      <div key={key} className="grammar-notes-line">
        {trimmed}
      </div>
    );
  }

  return (
    <div className="grammar-notes-rich">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const first = lines[0] ?? "";
        if (first.startsWith("■")) {
          const heading = first.replace(/^■\s*/, "");
          return (
            <div key={i} className="grammar-notes-section">
              <div className="grammar-notes-heading">{heading}</div>
              <div className="grammar-notes-body">
                {lines.slice(1).map((line, j) => renderLine(line, j))}
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="grammar-notes-paragraph">
            {lines.map((line, j) => renderLine(line, j))}
          </div>
        );
      })}
    </div>
  );
}

// ── Single lesson card ────────────────────────────────────────────────────────
function LessonCard({ item, expanded, onToggle }) {
  return (
    <div className={`grammar-lesson-card ${expanded ? "expanded" : ""}`}>
      <div className="grammar-lesson-header" role="button" tabIndex={0} onClick={onToggle} onKeyDown={(e) => e.key === "Enter" && onToggle()}>
        <div className="grammar-lesson-header-left">
          <span className="grammar-lesson-number">Lesson {item.lesson}</span>
          <span className="grammar-lesson-pattern">{item.pattern_name}</span>
          <span className="grammar-lesson-meaning">{item.meaning}</span>
        </div>
        <div className="grammar-lesson-header-right">
          <LevelPill level={item.level} />
          <AudioButton text={item.example_japanese} label={item.pattern_name} />
          <span className="grammar-lesson-chevron">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="grammar-lesson-body">
          <div className="grammar-lesson-structure">
            <span className="grammar-detail-label">Structure</span>
            <code className="grammar-structure-code">{item.structure_text}</code>
          </div>

          <div className="grammar-lesson-example">
            <span className="grammar-detail-label">Example</span>
            <div className="grammar-example-row">
              <div className="grammar-example-content">
                <div className="grammar-example-jp">{item.example_japanese}</div>
                <div className="grammar-example-reading">{item.example_reading}</div>
                <div className="grammar-example-en">{item.example_meaning}</div>
              </div>
              <AudioButton text={item.example_japanese} label="example sentence" size="md" />
            </div>
          </div>

          {item.notes && (
            <div className="grammar-lesson-notes">
              <span className="grammar-detail-label">Notes</span>
              <NotesRenderer text={item.notes} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chapter section ──────────────────────────────────────────────────────────
function ChapterSection({ chapter, lessons, expandedIds, onToggle }) {
  return (
    <div className="grammar-chapter">
      <div className="grammar-chapter-header">
        <span className="grammar-chapter-number">Chapter {chapter}</span>
        <span className="grammar-chapter-title">{lessons[0]?.chapter_title}</span>
        <span className="grammar-chapter-count">{lessons.length} points</span>
      </div>
      <div className="grammar-chapter-lessons">
        {lessons.map((item) => (
          <LessonCard
            key={item.id}
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main GrammarView ──────────────────────────────────────────────────────────
export default function GrammarView({ items, search }) {
  const [activeLevel, setActiveLevel] = useState("N5");
  const [expandedIds, setExpandedIds] = useState(new Set());

  function toggleLesson(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Separate items with chapter data (new curriculum) from legacy flat items
  const { chaptered, legacy } = useMemo(() => {
    const chaptered = items.filter((item) => item.chapter != null);
    const legacy = items.filter((item) => item.chapter == null);
    return { chaptered, legacy };
  }, [items]);

  // Filter by level, then group by chapter
  const filteredByLevel = useMemo(() => {
    const levelItems = search
      ? chaptered
      : chaptered.filter((item) => item.level === activeLevel);
    return levelItems;
  }, [chaptered, activeLevel, search]);

  const groupedByChapter = useMemo(() => {
    const map = new Map();
    for (const item of filteredByLevel) {
      const ch = item.chapter;
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch).push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredByLevel]);

  const n5Count = chaptered.filter((i) => i.level === "N5").length;
  const n4Count = chaptered.filter((i) => i.level === "N4").length;

  return (
    <div className="grammar-view">
      {!search && (
        <div className="grammar-level-tabs">
          {[["N5", n5Count], ["N4", n4Count]].map(([lvl, count]) => (
            <button
              key={lvl}
              className={`grammar-level-tab ${activeLevel === lvl ? "active" : ""} grammar-level-tab-${lvl.toLowerCase()}`}
              onClick={() => {
                setActiveLevel(lvl);
                setExpandedIds(new Set());
              }}
            >
              {lvl}
              <span className="grammar-level-tab-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {search ? (
        <div className="grammar-search-results">
          {filteredByLevel.length === 0 && legacy.length === 0 ? (
            <div className="grammar-empty">No grammar points match your search.</div>
          ) : (
            [...filteredByLevel, ...legacy].map((item) => (
              <LessonCard
                key={item.id}
                item={item}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleLesson(item.id)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="grammar-chapters">
          {groupedByChapter.length === 0 ? (
            <div className="grammar-empty">No grammar points found.</div>
          ) : (
            groupedByChapter.map(([chapter, lessons]) => (
              <ChapterSection
                key={chapter}
                chapter={chapter}
                lessons={lessons}
                expandedIds={expandedIds}
                onToggle={toggleLesson}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
