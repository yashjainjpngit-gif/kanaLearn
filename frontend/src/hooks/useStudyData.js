import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchCounters,
  fetchCounts,
  fetchGrammar,
  fetchKana,
  fetchKanji,
  fetchPracticeDashboard,
  fetchPracticeProgress,
  fetchRadicals,
  fetchReadings,
  fetchVocabulary,
} from "../api/kanjiApi";

function getStoredLearnedIds(tabKey) {
  const raw = window.localStorage.getItem(`study-learned-${tabKey}`);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function useStudyData({
  activeTab,
  clientId,
  readingUserId,
  search,
  activeCategoryId,
  activeVocabType,
  activeVocabLevel,
  activeVocabKana,
  vocabularyPage,
  roundSummaryCompleted,
}) {
  const [categoriesQuery, countsQuery] = useQueries({
    queries: [
      {
        queryKey: ["categories"],
        queryFn: fetchCategories,
      },
      {
        queryKey: ["counts"],
        queryFn: fetchCounts,
      },
    ],
  });

  const kanjiQuery = useQuery({
    queryKey: ["kanji", search, activeCategoryId],
    queryFn: () => fetchKanji({ search, categoryId: activeCategoryId }),
    enabled: activeTab === "kanji",
  });

  const radicalsQuery = useQuery({
    queryKey: ["radicals", search],
    queryFn: () => fetchRadicals({ search }),
    enabled: activeTab === "radicals",
  });

  const kanaQuery = useQuery({
    queryKey: ["kana", activeTab, search],
    queryFn: () => fetchKana({ script: activeTab, search }),
    enabled: activeTab === "hiragana" || activeTab === "katakana",
  });

  const vocabularyQuery = useQuery({
    queryKey: ["vocabulary", search, activeVocabType, activeVocabLevel, activeVocabKana, vocabularyPage],
    queryFn: () =>
      fetchVocabulary({
        search,
        wordType: activeVocabType === "All" ? "" : activeVocabType,
        level: activeVocabLevel,
        kanaGroup: activeVocabKana,
        limit: 100,
        offset: (vocabularyPage - 1) * 100,
      }),
    enabled: activeTab === "vocabulary",
  });

  const grammarQuery = useQuery({
    queryKey: ["grammar", search],
    queryFn: () => fetchGrammar({ search }),
    enabled: activeTab === "grammar",
  });

  const readingsQuery = useQuery({
    queryKey: ["readings", search, readingUserId],
    queryFn: () => fetchReadings({ search, userId: readingUserId }),
    enabled: activeTab === "readings",
  });

  const countersQuery = useQuery({
    queryKey: ["counters", search],
    queryFn: () => fetchCounters({ search }),
    enabled: activeTab === "counters",
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", clientId, roundSummaryCompleted],
    queryFn: async () => {
      const [hiraganaItems, katakanaItems, progressRows, dashboardData] = await Promise.all([
        fetchKana({ script: "hiragana" }),
        fetchKana({ script: "katakana" }),
        fetchPracticeProgress({ clientId }),
        fetchPracticeDashboard({ clientId }),
      ]);

      const learnedSummary = {
        kanji: getStoredLearnedIds("kanji").length,
        radicals: getStoredLearnedIds("radicals").length,
        hiragana: getStoredLearnedIds("hiragana").length,
        katakana: getStoredLearnedIds("katakana").length,
        vocabulary: getStoredLearnedIds("vocabulary").length,
        grammar: getStoredLearnedIds("grammar").length,
        counters: getStoredLearnedIds("counters").length,
      };

      const buildKanaSection = (label, key, items, learnedIds) => ({
        key,
        label,
        total: items.length,
        learned: items.filter((item) => learnedIds.has(item.id)).length,
      });

      const hiraganaLearned = new Set(getStoredLearnedIds("hiragana"));
      const katakanaLearned = new Set(getStoredLearnedIds("katakana"));

      return {
        totals: dashboardData.totals,
        learnedSummary,
        kanaSections: [
          buildKanaSection("Hiragana", "hiragana", hiraganaItems, hiraganaLearned),
          buildKanaSection("Katakana", "katakana", katakanaItems, katakanaLearned),
        ],
        practiceSummary: progressRows.map((entry) => {
          const attempts = Number(entry.attempts ?? 0);
          const correctAttempts = Number(entry.correctAttempts ?? 0);

          return {
            studyType: entry.studyType,
            attempts,
            accuracyPercent: attempts ? (correctAttempts / attempts) * 100 : 0,
          };
        }),
        weakItems: dashboardData.weakItems ?? [],
      };
    },
    enabled: activeTab === "dashboard" && Boolean(clientId),
  });

  const currentDataQuery = useMemo(() => {
    if (activeTab === "kanji") return kanjiQuery;
    if (activeTab === "radicals") return radicalsQuery;
    if (activeTab === "hiragana" || activeTab === "katakana") return kanaQuery;
    if (activeTab === "vocabulary") return vocabularyQuery;
    if (activeTab === "grammar") return grammarQuery;
    if (activeTab === "counters") return countersQuery;
    if (activeTab === "readings") return readingsQuery;
    if (activeTab === "dashboard") return dashboardQuery;
    return null;
  }, [activeTab, countersQuery, dashboardQuery, grammarQuery, kanaQuery, kanjiQuery, radicalsQuery, readingsQuery, vocabularyQuery]);

  const error =
    categoriesQuery.error?.message ||
    countsQuery.error?.message ||
    currentDataQuery?.error?.message ||
    "";

  return {
    categories: categoriesQuery.data ?? [],
    counts: countsQuery.data ?? {},
    kanji: kanjiQuery.data ?? [],
    moduleItems:
      activeTab === "vocabulary"
        ? vocabularyQuery.data?.items ?? []
        : activeTab === "radicals"
          ? radicalsQuery.data ?? []
          : activeTab === "hiragana" || activeTab === "katakana"
            ? kanaQuery.data ?? []
            : activeTab === "grammar"
              ? grammarQuery.data ?? []
              : activeTab === "counters"
                ? countersQuery.data ?? []
                : activeTab === "readings"
                  ? readingsQuery.data ?? []
                  : [],
    vocabularyLevelCounts: vocabularyQuery.data?.levelCounts ?? {},
    vocabularyTotal: vocabularyQuery.data?.total ?? 0,
    dashboardStats:
      dashboardQuery.data ?? {
        totals: {
          rounds: 0,
          answers: 0,
          correct: 0,
          incorrect: 0,
          accuracyPercent: 0,
          studyDays: 0,
        },
        learnedSummary: {},
        kanaSections: [],
        practiceSummary: [],
        weakItems: [],
      },
    loading:
      categoriesQuery.isLoading ||
      countsQuery.isLoading ||
      currentDataQuery?.isLoading ||
      currentDataQuery?.isFetching ||
      false,
    error,
  };
}
