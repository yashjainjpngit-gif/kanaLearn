import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createUserReading } from "../api/kanjiApi";

function parseVocabInput(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [word = "", reading = "", meaning = ""] = line.split("|").map((part) => part.trim());
      return { word, reading, meaning };
    })
    .filter((entry) => entry.word || entry.reading || entry.meaning);
}

export default function ReadingAddPage({ auth }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [level, setLevel] = useState("N5");
  const [japaneseText, setJapaneseText] = useState("");
  const [readingText, setReadingText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [vocabInput, setVocabInput] = useState("");

  const mutation = useMutation({
    mutationFn: createUserReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readings"] });
      queryClient.invalidateQueries({ queryKey: ["userReadings", auth?.userId] });
      navigate("/readings");
    },
  });

  if (!auth) {
    return <div className="empty-state">Sign in to add your own reading passages.</div>;
  }

  return (
    <section className="reading-add-page">
      <div className="challenge-panel">
        <div className="section-header">
          <h2 className="section-title">Create Reading Passage</h2>
        </div>
        <div className="reading-add-form">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} placeholder="English title" />
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
          </select>
          <textarea
            className="reading-user-textarea"
            value={japaneseText}
            onChange={(event) => setJapaneseText(event.target.value)}
            placeholder="Original Japanese text"
          />
          <textarea
            className="reading-user-textarea"
            value={readingText}
            onChange={(event) => setReadingText(event.target.value)}
            placeholder="Hiragana reading text"
          />
          <textarea
            className="reading-user-textarea"
            value={englishText}
            onChange={(event) => setEnglishText(event.target.value)}
            placeholder="English translation"
          />
          <textarea
            className="reading-user-textarea"
            value={vocabInput}
            onChange={(event) => setVocabInput(event.target.value)}
            placeholder={"Vocabulary lines: word | reading | meaning"}
          />
          <button
            type="button"
            className="practice-primary-button"
            disabled={!title.trim() || !readingText.trim() || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                userId: auth.userId,
                title,
                titleEn,
                level,
                japaneseText,
                readingText,
                englishText,
                vocab: parseVocabInput(vocabInput),
              })
            }
          >
            {mutation.isPending ? "Saving…" : "Save Reading"}
          </button>
          {mutation.error ? <div className="error-banner">{mutation.error.message}</div> : null}
        </div>
      </div>
    </section>
  );
}
