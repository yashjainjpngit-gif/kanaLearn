import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createPracticeSession,
  fetchPracticeItemSummary,
  fetchPracticeProgress,
} from "./api/kanjiApi";
import AppContent from "./components/AppContent";
import CategoryFilter from "./components/CategoryFilter";
import KanaRowFilter from "./components/KanaRowFilter";
import KanjiModal from "./components/KanjiModal";
import LoginModal from "./components/LoginModal";
import PracticeModeSelector from "./components/PracticeModeSelector";
import PracticeView from "./components/PracticeView";
import SearchBar from "./components/SearchBar";
import StudyItemModal from "./components/StudyItemModal";
import StudyTabs from "./components/StudyTabs";
import useAuth from "./hooks/useAuth";
import {
  filterPracticeItemsByGroup,
  getPracticeGroupOptions,
  getPracticeModes,
} from "./components/practiceUtils";
import usePersistentState from "./hooks/usePersistentState";
import useStudyData from "./hooks/useStudyData";
import { getKanaRowMeta } from "./utils/kanaRows";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  challenges: "Challenges",
  kanji: "Kanji",
  radicals: "Radicals",
  hiragana: "Hiragana",
  katakana: "Katakana",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  counters: "Counters",
  readings: "Readings",
  conjugator: "Conjugator",
  addReading: "Add Reading",
};

function getActiveTabFromPathname(pathname) {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/challenges" || pathname.startsWith("/challenges/")) return "challenges";
  if (pathname === "/radicals") return "radicals";
  if (pathname === "/hiragana") return "hiragana";
  if (pathname === "/katakana") return "katakana";
  if (pathname === "/kanji") return "kanji";
  if (pathname === "/vocabulary") return "vocabulary";
  if (pathname === "/grammar") return "grammar";
  if (pathname === "/readings") return "readings";
  if (pathname === "/readings/add") return "readings";
  if (pathname === "/conjugator") return "conjugator";
  if (pathname === "/counters") return "counters";
  return null;
}

function createClientId() {
  return `study-${crypto.randomUUID()}`;
}

function shuffleAndSlice(items, count) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default function App() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeVocabType, setActiveVocabType] = useState("All");
  const [activeVocabLevel, setActiveVocabLevel] = useState("");
  const [activeVocabKana, setActiveVocabKana] = useState("");
  const [activeKanaRows, setActiveKanaRows] = useState([]);
  const [vocabularyPage, setVocabularyPage] = useState(1);
  const [viewMode, setViewMode] = useState("browse");
  const [practiceSourceMode, setPracticeSourceMode] = useState("all");
  const [practiceGroups, setPracticeGroups] = useState([]);
  const [practiceCount, setPracticeCount] = useState(10);
  const [flashcardMode, setFlashcardMode] = useState("");
  const [quizMode, setQuizMode] = useState("multiple_choice");
  const [quizPromptMode, setQuizPromptMode] = useState("");
  const [quizAnswerMode, setQuizAnswerMode] = useState("");
  const [practiceSetupCollapsed, setPracticeSetupCollapsed] = useState(false);
  const [practiceRoundKey, setPracticeRoundKey] = useState(0);
  const [activePracticeItems, setActivePracticeItems] = useState([]);
  const [roundSummary, setRoundSummary] = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [clientId] = usePersistentState("study-client-id", createClientId);
  // When logged in, use the stable userId so progress survives cache clears
  const effectiveClientId = auth?.userId || clientId;
  const activeTab = getActiveTabFromPathname(location.pathname) ?? "kanji";
  const isAddReadingRoute = location.pathname === "/readings/add";
  const [learnedIds, setLearnedIds] = usePersistentState(`study-learned-${activeTab}`, []);

  useEffect(() => {
    if (!getActiveTabFromPathname(location.pathname)) {
      navigate("/kanji", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setSelectedItem(null);
    setActiveVocabType("All");
    setActiveVocabLevel("");
    setActiveVocabKana("");
    setActiveKanaRows([]);
    setVocabularyPage(1);
  }, [activeTab, activeCategoryId, search]);

  useEffect(() => {
    setVocabularyPage(1);
  }, [activeVocabType, activeVocabLevel, activeVocabKana]);

  useEffect(() => {
    setViewMode("browse");
    setPracticeSourceMode("all");
    setPracticeSetupCollapsed(false);
    setActivePracticeItems([]);
    setRoundSummary(null);
  }, [activeTab]);

  const {
    categories,
    counts,
    kanji,
    moduleItems,
    vocabularyLevelCounts,
    vocabularyTotal,
    dashboardStats,
    loading,
    error,
  } = useStudyData({
    activeTab,
    clientId: effectiveClientId,
    readingUserId: auth?.userId || "",
    search,
    activeCategoryId,
    activeVocabType,
    activeVocabLevel,
    activeVocabKana,
    vocabularyPage,
    roundSummaryCompleted: roundSummary?.completed,
  });

  const learnedSet = useMemo(() => new Set(learnedIds), [learnedIds]);
  const isPracticeTab = ["hiragana", "katakana", "kanji", "vocabulary", "counters"].includes(activeTab);

  const kanaRowOptions = useMemo(() => {
    if (activeTab !== "hiragana" && activeTab !== "katakana") {
      return [];
    }

    const groupedRows = moduleItems.reduce((rows, item) => {
      const { label, order } = getKanaRowMeta(item);
      if (!label) {
        return rows;
      }

      const current = rows.get(label);
      if (current) {
        current.count += 1;
      } else {
        rows.set(label, {
          value: label,
          label,
          order,
          count: 1,
        });
      }

      return rows;
    }, new Map());

    return Array.from(groupedRows.values()).sort((left, right) => left.order - right.order);
  }, [activeTab, moduleItems]);

  const filteredModuleItems = useMemo(() => {
    if ((activeTab !== "hiragana" && activeTab !== "katakana") || !activeKanaRows.length) {
      return moduleItems;
    }

    const selectedRows = new Set(activeKanaRows);
    return moduleItems.filter((item) => selectedRows.has(getKanaRowMeta(item).label));
  }, [activeKanaRows, activeTab, moduleItems]);

  const groupedKanji = useMemo(() => {
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const groups = [];

    for (const item of kanji) {
      const category = categoryMap.get(item.categoryId);
      if (!category) continue;

      const previous = groups.at(-1);
      if (previous && previous.category.id === category.id) {
        previous.items.push(item);
      } else {
        groups.push({ category, items: [item] });
      }
    }

    return groups;
  }, [categories, kanji]);

  const practiceModeConfig = useMemo(() => getPracticeModes(activeTab), [activeTab]);
  const groupOptions = useMemo(
    () => getPracticeGroupOptions(activeTab, filteredModuleItems),
    [activeTab, filteredModuleItems]
  );

  useEffect(() => {
    const nextGroups = groupOptions.map((group) => group.value);
    setPracticeGroups((current) =>
      current.length === nextGroups.length &&
      current.every((value, index) => value === nextGroups[index])
        ? current
        : nextGroups
    );
  }, [groupOptions]);

  useEffect(() => {
    const defaultFlashcardMode = practiceModeConfig.flashcardModes[0]?.value ?? "";
    const defaultQuizMode = practiceModeConfig.quizModes?.[0]?.value ?? "multiple_choice";
    const defaultPromptMode = practiceModeConfig.promptModes[0]?.value ?? "";
    const defaultAnswerMode =
      practiceModeConfig.answerModes.find((mode) => mode.value !== defaultPromptMode)?.value ??
      practiceModeConfig.answerModes[0]?.value ??
      "";

    setFlashcardMode(defaultFlashcardMode);
    setQuizMode(defaultQuizMode);
    setQuizPromptMode(defaultPromptMode);
    setQuizAnswerMode(defaultAnswerMode);
  }, [practiceModeConfig]);

  const progressQuery = useQuery({
    queryKey: ["practiceProgress", effectiveClientId, activeTab, roundSummary?.completed],
    queryFn: async () => {
      const rows = await fetchPracticeProgress({ clientId: effectiveClientId, studyType: activeTab });
      return rows[0] ?? null;
    },
    enabled: Boolean(clientId) && isPracticeTab,
  });

  const weakItemsQuery = useQuery({
    queryKey: ["practiceWeakItems", effectiveClientId, activeTab],
    queryFn: () => fetchPracticeItemSummary({ clientId: effectiveClientId, studyType: activeTab, limit: 100 }),
    enabled: Boolean(effectiveClientId) && isPracticeTab,
  });

  const practiceSourceItems = useMemo(() => {
    const weakIds = new Set((weakItemsQuery.data ?? []).map((entry) => entry.itemId));

    if (activeTab === "kanji") {
      if (practiceSourceMode === "mistakes") {
        return kanji.filter((item) => weakIds.has(item.id));
      }
      if (practiceSourceMode === "learned") {
        return kanji.filter((item) => learnedSet.has(item.id));
      }
      if (practiceSourceMode === "unlearned") {
        return kanji.filter((item) => !learnedSet.has(item.id));
      }
      return kanji;
    }

    if (activeTab === "vocabulary") {
      if (practiceSourceMode === "mistakes") {
        return filteredModuleItems.filter((item) => weakIds.has(item.id));
      }
      if (practiceSourceMode === "learned") {
        return filteredModuleItems.filter((item) => learnedSet.has(item.id));
      }
      if (practiceSourceMode === "unlearned") {
        return filteredModuleItems.filter((item) => !learnedSet.has(item.id));
      }
      return filteredModuleItems;
    }

    if (activeTab === "hiragana" || activeTab === "katakana") {
      if (!practiceGroups.length) {
        return [];
      }

      const filteredItems = filterPracticeItemsByGroup(activeTab, filteredModuleItems, practiceGroups);
      if (practiceSourceMode === "mistakes") {
        return filteredItems.filter((item) => weakIds.has(item.id));
      }
      if (practiceSourceMode === "learned") {
        return filteredItems.filter((item) => learnedSet.has(item.id));
      }
      if (practiceSourceMode === "unlearned") {
        return filteredItems.filter((item) => !learnedSet.has(item.id));
      }
      return filteredItems;
    }

    if (activeTab === "counters") {
      if (practiceSourceMode === "learned") {
        return filteredModuleItems.filter((item) => learnedSet.has(item.id));
      }
      if (practiceSourceMode === "unlearned") {
        return filteredModuleItems.filter((item) => !learnedSet.has(item.id));
      }
      return filteredModuleItems;
    }

    return [];
  }, [activeTab, filteredModuleItems, kanji, learnedSet, practiceGroups, practiceSourceMode, weakItemsQuery.data]);

  useEffect(() => {
    const defaultCount = practiceSourceItems.length >= 10 ? 10 : practiceSourceItems.length;
    setPracticeCount(defaultCount);
  }, [practiceSourceItems.length, activeTab]);

  useEffect(() => {
    setActivePracticeItems([]);
    setRoundSummary(null);
    setPracticeSetupCollapsed(false);
  }, [
    activeTab,
    viewMode,
    search,
    activeCategoryId,
    activeVocabType,
    flashcardMode,
    quizMode,
    quizPromptMode,
    quizAnswerMode,
    practiceSourceMode,
    practiceGroups.join("|"),
  ]);

  function toggleLearned(id) {
    setLearnedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function setLearnedBatch(ids, shouldLearn) {
    setLearnedIds((current) => {
      const next = new Set(current);

      ids.forEach((id) => {
        if (shouldLearn) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });

      return Array.from(next);
    });
  }

  const showCategoryFilter = activeTab === "kanji";
  const visibleItems = activeTab === "kanji" ? kanji : filteredModuleItems;

  function togglePracticeGroup(groupValue) {
    setPracticeGroups((current) =>
      current.includes(groupValue)
        ? current.filter((value) => value !== groupValue)
        : [...current, groupValue]
    );
  }

  function handlePromptModeChange(nextMode) {
    setQuizPromptMode(nextMode);

    if (nextMode === quizAnswerMode) {
      const fallback =
        practiceModeConfig.answerModes.find((mode) => mode.value !== nextMode)?.value ?? nextMode;
      setQuizAnswerMode(fallback);
    }
  }

  function handleAnswerModeChange(nextMode) {
    setQuizAnswerMode(nextMode);

    if (nextMode === quizPromptMode) {
      const fallback =
        practiceModeConfig.promptModes.find((mode) => mode.value !== nextMode)?.value ?? nextMode;
      setQuizPromptMode(fallback);
    }
  }

  function handleQuizModeChange(nextMode) {
    setQuizMode(nextMode);

    if ((activeTab === "hiragana" || activeTab === "katakana") && nextMode === "draw") {
      setQuizAnswerMode("character");
    }
  }

  function handleStartRound() {
    const nextItems = shuffleAndSlice(practiceSourceItems, practiceCount);
    setActivePracticeItems(nextItems);
    setPracticeRoundKey((value) => value + 1);
    setPracticeSetupCollapsed(true);
    setRoundSummary({
      itemCount: nextItems.length,
      answeredCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      accuracyPercent: 0,
      completed: false,
    });
  }

  function handleQuickStart(nextViewMode, nextSourceMode) {
    setPracticeSourceMode(nextSourceMode);
    setViewMode(nextViewMode);
    setPracticeSetupCollapsed(true);

    const filteredItems = (() => {
      if (nextSourceMode === "learned") {
        return visibleItems.filter((item) => learnedSet.has(item.id));
      }
      if (nextSourceMode === "unlearned") {
        return visibleItems.filter((item) => !learnedSet.has(item.id));
      }
      return visibleItems;
    })();

    const nextItems = shuffleAndSlice(filteredItems, practiceCount);
    setActivePracticeItems(nextItems);
    setPracticeRoundKey((value) => value + 1);
    setRoundSummary({
      itemCount: nextItems.length,
      answeredCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      accuracyPercent: 0,
      completed: false,
    });
  }

  function handleShuffleRound() {
    const nextItems = shuffleAndSlice(practiceSourceItems, practiceCount);
    setActivePracticeItems(nextItems);
    setPracticeRoundKey((value) => value + 1);
    setRoundSummary((current) =>
      current
        ? {
            ...current,
            itemCount: nextItems.length,
            answeredCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            accuracyPercent: 0,
            completed: false,
          }
        : null
    );
  }

  const handleRoundProgress = useCallback((progress) => {
    setRoundSummary((current) => ({
      ...(current ?? {}),
      ...progress,
      accuracyPercent:
        progress.answeredCount > 0 ? (progress.correctCount / progress.answeredCount) * 100 : 0,
      completed: false,
    }));
  }, []);

  const handleRoundComplete = useCallback(async (summary) => {
    const nextSummary = {
      ...summary,
      answeredCount: summary.answers.length,
      completed: true,
    };

    setRoundSummary(nextSummary);
    setSavingSession(true);

    try {
      await createPracticeSession({
        clientId: effectiveClientId,
        studyType: activeTab,
        practiceMode: viewMode,
        promptMode: viewMode === "quiz" ? quizPromptMode : null,
        answerMode:
          viewMode === "quiz"
            ? quizAnswerMode
            : flashcardMode.split("_to_")[1] ?? null,
        itemCount: summary.itemCount,
        correctCount: summary.correctCount,
        incorrectCount: summary.incorrectCount,
        accuracyPercent: Number(summary.accuracyPercent.toFixed(2)),
        selection: {
          search,
          activeCategoryId,
          activeVocabType,
          practiceGroups,
          practiceCount,
          flashcardMode,
          quizMode,
          quizPromptMode,
          quizAnswerMode,
        },
        answers: summary.answers,
      });
      queryClient.invalidateQueries({ queryKey: ["practiceProgress", effectiveClientId, activeTab] });
      queryClient.invalidateQueries({ queryKey: ["practiceWeakItems", effectiveClientId, activeTab] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", effectiveClientId] });
    } finally {
      setSavingSession(false);
    }
  }, [
    activeCategoryId,
    activeTab,
    activeVocabType,
    effectiveClientId,
    flashcardMode,
    practiceCount,
    practiceGroups,
    queryClient,
    quizAnswerMode,
    quizMode,
    quizPromptMode,
    search,
    viewMode,
  ]);

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="nav-kanji">漢</span>
          <span className="nav-title">Kanji Study</span>
        </div>
        <StudyTabs counts={counts} />
        <div className="nav-auth">
          {auth ? (
            <div className="nav-user">
              <span className="nav-user-email">{auth.email}</span>
              <button className="nav-logout-btn" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <button className="nav-login-btn" onClick={() => setShowLoginModal(true)}>
              Sign in
            </button>
          )}
        </div>
      </nav>

      <main className="page">
        <div className="page-header">
          <h1 className="page-title">{isAddReadingRoute ? PAGE_TITLES.addReading : PAGE_TITLES[activeTab]}</h1>
          <div className="page-header-right">
            {activeTab !== "dashboard" && activeTab !== "challenges" && activeTab !== "conjugator" && !isAddReadingRoute ? <SearchBar value={search} onChange={setSearch} /> : null}
            {isPracticeTab ? (
              <PracticeModeSelector
                activeMode={viewMode}
                onChange={setViewMode}
                disabled={loading || Boolean(error)}
                activeTab={activeTab}
              />
            ) : null}
          </div>
        </div>

        {showCategoryFilter ? (
          <div className="page-filters">
            <CategoryFilter
              categories={categories}
              activeCategoryId={activeCategoryId}
              onChange={setActiveCategoryId}
            />
          </div>
        ) : null}

        {activeTab === "hiragana" || activeTab === "katakana" ? (
          <div className="page-filters">
            <KanaRowFilter
              rowOptions={kanaRowOptions}
              selectedRows={activeKanaRows}
              onToggleRow={(rowLabel) =>
                setActiveKanaRows((current) =>
                  current.includes(rowLabel)
                    ? current.filter((value) => value !== rowLabel)
                    : [...current, rowLabel]
                )
              }
              onClear={() => setActiveKanaRows([])}
            />
          </div>
        ) : null}

        {isPracticeTab && viewMode !== "browse" && viewMode !== "learn" ? (
          <PracticeView
            activeTab={activeTab}
            activePracticeItems={activePracticeItems}
            flashcardMode={flashcardMode}
            groupOptions={groupOptions}
            handleAnswerModeChange={handleAnswerModeChange}
            handlePromptModeChange={handlePromptModeChange}
            handleQuizModeChange={handleQuizModeChange}
            handleRoundComplete={handleRoundComplete}
            handleRoundProgress={handleRoundProgress}
            handleShuffleRound={handleShuffleRound}
            handleStartRound={handleStartRound}
            practiceCount={practiceCount}
            practiceGroups={practiceGroups}
            practiceModeConfig={practiceModeConfig}
            practiceRoundKey={practiceRoundKey}
            practiceSetupCollapsed={practiceSetupCollapsed}
            practiceSourceItems={practiceSourceItems}
            practiceSourceMode={practiceSourceMode}
            progressSummary={progressQuery.data ?? null}
            quizAnswerMode={quizAnswerMode}
            quizMode={quizMode}
            quizPromptMode={quizPromptMode}
            roundSummary={roundSummary}
            savingSession={savingSession}
            setFlashcardMode={setFlashcardMode}
            setPracticeCount={setPracticeCount}
            setPracticeSourceMode={setPracticeSourceMode}
            setPracticeSetupCollapsed={setPracticeSetupCollapsed}
            togglePracticeGroup={togglePracticeGroup}
            viewMode={viewMode}
          />
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="loading-state">Loading…</div> : null}

        <AppContent
          activeTab={activeTab}
          viewMode={viewMode}
          loading={loading}
          error={error}
          search={search}
          groupedKanji={groupedKanji}
          visibleItems={visibleItems}
          learnedSet={learnedSet}
          setSelectedItem={setSelectedItem}
          setLearnedBatch={setLearnedBatch}
          vocabularyTotal={vocabularyTotal}
          vocabularyPage={vocabularyPage}
          activeVocabType={activeVocabType}
          activeVocabLevel={activeVocabLevel}
          activeVocabKana={activeVocabKana}
          vocabularyLevelCounts={vocabularyLevelCounts}
          setActiveVocabType={setActiveVocabType}
          setActiveVocabLevel={setActiveVocabLevel}
          setActiveVocabKana={setActiveVocabKana}
          setVocabularyPage={setVocabularyPage}
          setViewMode={setViewMode}
          toggleLearned={toggleLearned}
          handleQuickStart={handleQuickStart}
          dashboardStats={dashboardStats}
          counts={counts}
          auth={auth}
          isAddReadingRoute={isAddReadingRoute}
        />
      </main>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {activeTab === "kanji" ? (
        <KanjiModal
          item={selectedItem}
          isLearned={selectedItem ? learnedSet.has(selectedItem.id) : false}
          onClose={() => setSelectedItem(null)}
          onToggleLearn={toggleLearned}
        />
      ) : (
        <StudyItemModal
          activeTab={activeTab}
          item={selectedItem}
          isLearned={selectedItem ? learnedSet.has(selectedItem.id) : false}
          onClose={() => setSelectedItem(null)}
          onToggleLearn={toggleLearned}
        />
      )}
    </div>
  );
}
