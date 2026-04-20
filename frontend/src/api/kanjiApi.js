const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

function buildUrl(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      searchParams.set(key, value);
    }
  });

  return searchParams.toString() ? `${API_BASE_URL}/${path}?${searchParams}` : `${API_BASE_URL}/${path}`;
}

export async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`);
  return handleResponse(response);
}

export async function fetchCounts() {
  const response = await fetch(`${API_BASE_URL}/counts`);
  return handleResponse(response);
}

export async function fetchKanji({ search = "", categoryId = "" } = {}) {
  const response = await fetch(buildUrl("kanji", { search, categoryId }));
  return handleResponse(response);
}

export async function fetchRadicals({ search = "" } = {}) {
  const response = await fetch(buildUrl("radicals", { search }));
  return handleResponse(response);
}

export async function fetchKana({ script, search = "" } = {}) {
  const response = await fetch(buildUrl("kana", { script, search }));
  return handleResponse(response);
}

export async function fetchVocabulary({
  search = "",
  wordType = "",
  level = "",
  kanaGroup = "",
  readingPrefix = "",
  limit = 20,
  offset = 0,
} = {}) {
  const response = await fetch(buildUrl("vocabulary", { search, wordType, level, kanaGroup, readingPrefix, limit, offset }));
  return handleResponse(response);
}

export async function fetchGrammar({ search = "" } = {}) {
  const response = await fetch(buildUrl("grammar", { search }));
  return handleResponse(response);
}

export async function fetchReadings({ search = "", level = "", userId = "" } = {}) {
  const response = await fetch(buildUrl("readings", { search, level, userId }));
  return handleResponse(response);
}

export async function fetchUserReadings({ userId } = {}) {
  const response = await fetch(buildUrl("user-readings", { userId }));
  return handleResponse(response);
}

export async function createUserReading(payload) {
  const response = await fetch(`${API_BASE_URL}/user-readings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function fetchUserReadingSentences({ userId, readingId = "", linkedVocab = "" } = {}) {
  const response = await fetch(buildUrl("user-reading-sentences", { userId, readingId, linkedVocab }));
  return handleResponse(response);
}

export async function createUserReadingSentence(payload) {
  const response = await fetch(`${API_BASE_URL}/user-reading-sentences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function fetchPracticeProgress({ clientId, studyType = "" } = {}) {
  const response = await fetch(buildUrl("practice/progress", { clientId, studyType }));
  return handleResponse(response);
}

export async function fetchPracticeItemSummary({ clientId, studyType, limit = 50 } = {}) {
  const response = await fetch(buildUrl("practice/items", { clientId, studyType, limit }));
  return handleResponse(response);
}

export async function fetchPracticeDashboard({ clientId } = {}) {
  const response = await fetch(buildUrl("practice/dashboard", { clientId }));
  return handleResponse(response);
}

export async function createPracticeSession(payload) {
  const response = await fetch(`${API_BASE_URL}/practice/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function fetchChallenges({ userId } = {}) {
  const response = await fetch(buildUrl("challenges", { userId }));
  return handleResponse(response);
}

export async function fetchChallenge({ challengeId } = {}) {
  const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`);
  return handleResponse(response);
}

export async function fetchChallengeLeaderboard({ challengeId } = {}) {
  const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/leaderboard`);
  return handleResponse(response);
}

export async function createChallenge(payload) {
  const response = await fetch(`${API_BASE_URL}/challenges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function joinChallenge(payload) {
  const response = await fetch(`${API_BASE_URL}/challenges/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}
