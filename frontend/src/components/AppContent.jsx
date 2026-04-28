import Dashboard from "./Dashboard";
import ChallengesView from "./ChallengesView";
import ConjugatorView from "./ConjugatorView";
import CountersView from "./CountersView";
import EmptyState from "./EmptyState";
import GrammarView from "./GrammarView";
import KanaRows from "./KanaRows";
import KanjiSection from "./KanjiSection";
import ModuleGrid from "./ModuleGrid";
import ReadingAddPage from "./ReadingAddPage";
import ReadingsView from "./ReadingsView";
import VocabLearnMode from "./VocabLearnMode";
import VocabularyTable from "./VocabularyTable";

export default function AppContent({
  activeTab,
  viewMode,
  loading,
  error,
  search,
  groupedKanji,
  visibleItems,
  learnedSet,
  setSelectedItem,
  setLearnedBatch,
  vocabularyTotal,
  vocabularyPage,
  activeVocabType,
  activeVocabLevel,
  activeVocabKana,
  vocabularyLevelCounts,
  setActiveVocabType,
  setActiveVocabLevel,
  setActiveVocabKana,
  setVocabularyPage,
  setViewMode,
  toggleLearned,
  handleQuickStart,
  dashboardStats,
  counts,
  practicePlaceholder,
  auth,
  isAddReadingRoute,
}) {
  if (loading || error) {
    return null;
  }

  // Vocab daily learn mode
  if (activeTab === "vocabulary" && viewMode === "learn") {
    return (
      <VocabLearnMode
        items={visibleItems}
        learnedSet={learnedSet}
        onToggleLearn={toggleLearned}
      />
    );
  }

  if (activeTab === "dashboard") {
    return (
      <Dashboard
        counts={counts}
        learnedSummary={{
          ...dashboardStats.learnedSummary,
          ...(dashboardStats.totals ?? {}),
        }}
        kanaSections={dashboardStats.kanaSections}
        practiceSummary={{
          byType: dashboardStats.practiceSummary,
          weakItems: dashboardStats.weakItems ?? [],
        }}
      />
    );
  }

  if (activeTab === "challenges") {
    return <ChallengesView auth={auth} />;
  }

  if (activeTab === "conjugator") {
    return <ConjugatorView />;
  }

  if (viewMode !== "browse") {
    return practicePlaceholder;
  }

  if (activeTab === "kanji") {
    return groupedKanji.length ? (
      <section className="section-stack">
        {groupedKanji.map(({ category, items }) => (
          <KanjiSection
            key={category.id}
            category={category}
            items={items}
            learnedSet={learnedSet}
            onSelect={setSelectedItem}
          />
        ))}
      </section>
    ) : (
      <EmptyState search={search} />
    );
  }

  if (!visibleItems.length) {
    return <EmptyState search={search} />;
  }

  if (activeTab === "hiragana" || activeTab === "katakana") {
    return (
      <KanaRows
        items={visibleItems}
        learnedSet={learnedSet}
        onSelect={setSelectedItem}
        onSetRowLearned={setLearnedBatch}
      />
    );
  }

  if (activeTab === "vocabulary") {
    return (
      <VocabularyTable
        items={visibleItems}
        total={vocabularyTotal}
        limit={100}
        offset={(vocabularyPage - 1) * 100}
        activeType={activeVocabType}
        activeLevel={activeVocabLevel}
        activeKana={activeVocabKana}
        levelCounts={vocabularyLevelCounts}
        learnedSet={learnedSet}
        onTypeChange={setActiveVocabType}
        onLevelChange={setActiveVocabLevel}
        onKanaChange={setActiveVocabKana}
        onSelect={setSelectedItem}
        onPageChange={setVocabularyPage}
        onToggleLearn={toggleLearned}
      />
    );
  }

  if (activeTab === "counters") {
    return <CountersView items={visibleItems} search={search} />;
  }

  if (activeTab === "grammar") {
    return <GrammarView items={visibleItems} search={search} />;
  }

  if (activeTab === "readings") {
    if (isAddReadingRoute) {
      return <ReadingAddPage auth={auth} />;
    }
    return <ReadingsView items={visibleItems} search={search} auth={auth} />;
  }

  return (
    <ModuleGrid
      items={visibleItems}
      activeTab={activeTab}
      learnedSet={learnedSet}
      onSelect={setSelectedItem}
    />
  );
}
