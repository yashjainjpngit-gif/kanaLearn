import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  createChallenge,
  fetchChallenge,
  fetchChallengeLeaderboard,
  fetchChallenges,
  joinChallenge,
} from "../api/kanjiApi";

const STUDY_TYPE_OPTIONS = [
  { value: "hiragana", label: "Hiragana" },
  { value: "katakana", label: "Katakana" },
  { value: "kanji", label: "Kanji" },
  { value: "vocabulary", label: "Vocabulary" },
];

const METRIC_OPTIONS = [
  { value: "correct_answers", label: "Correct Answers" },
  { value: "rounds_completed", label: "Rounds Completed" },
  { value: "accuracy", label: "Accuracy %" },
];

function getChallengeStatus(challenge) {
  const now = new Date();
  const start = new Date(challenge.startsAt);
  const end = new Date(challenge.endsAt);

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleDateString();
}

function StatusBadge({ status }) {
  const labels = { active: "Active", upcoming: "Upcoming", ended: "Ended" };

  return (
    <span className={`challenge-status-badge challenge-status-badge--${status}`}>
      {labels[status]}
    </span>
  );
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function NewChallengePanel({ auth, onCreated, onJoined }) {
  const [tab, setTab] = useState("create");
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [studyType, setStudyType] = useState("kanji");
  const [metric, setMetric] = useState("correct_answers");
  const [targetValue, setTargetValue] = useState(50);
  const [startsAt, setStartsAt] = useState(today);
  const [endsAt, setEndsAt] = useState(nextWeek);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) {
      setTab("join");
      setInviteCode(invite.toUpperCase());
    }
  }, []);

  const createMutation = useMutation({
    mutationFn: createChallenge,
    onSuccess: (data) => {
      onCreated(data.challengeId);
      setTitle("");
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinChallenge,
    onSuccess: (data) => {
      onJoined(data.challengeId);
      setInviteCode("");
    },
  });

  const dateError = startsAt && endsAt && endsAt <= startsAt ? "End date must be after start date" : null;
  const canCreate = title.trim().length > 0 && !dateError && !createMutation.isPending;
  const canJoin = inviteCode.trim().length >= 4 && !joinMutation.isPending;

  return (
    <div className="challenge-new-panel">
      <div className="challenge-tab-bar">
        <button
          type="button"
          className={`challenge-tab-btn ${tab === "create" ? "active" : ""}`}
          onClick={() => {
            setTab("create");
            createMutation.reset();
          }}
        >
          Create Challenge
        </button>
        <button
          type="button"
          className={`challenge-tab-btn ${tab === "join" ? "active" : ""}`}
          onClick={() => {
            setTab("join");
            joinMutation.reset();
          }}
        >
          Join by Code
        </button>
      </div>

      {tab === "create" ? (
        <div className="challenge-form-body">
          <label className="challenge-field">
            <span className="challenge-field-label">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Weekly Kana Sprint"
              maxLength={80}
            />
          </label>

          <div className="challenge-field-row">
            <label className="challenge-field">
              <span className="challenge-field-label">Study type</span>
              <select value={studyType} onChange={(event) => setStudyType(event.target.value)}>
                {STUDY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="challenge-field">
              <span className="challenge-field-label">Metric</span>
              <select value={metric} onChange={(event) => setMetric(event.target.value)}>
                {METRIC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="challenge-field">
            <span className="challenge-field-label">Target value</span>
            <input
              type="number"
              min="1"
              value={targetValue}
              onChange={(event) => setTargetValue(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>

          <div className="challenge-field-row">
            <label className="challenge-field">
              <span className="challenge-field-label">Start date</span>
              <input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
            </label>

            <label className="challenge-field">
              <span className="challenge-field-label">End date</span>
              <input type="date" value={endsAt} min={startsAt} onChange={(event) => setEndsAt(event.target.value)} />
            </label>
          </div>

          {dateError ? <p className="challenge-error">{dateError}</p> : null}
          {createMutation.error ? <p className="challenge-error">{createMutation.error.message}</p> : null}

          <button
            type="button"
            className="primary-button"
            disabled={!canCreate}
            onClick={() =>
              createMutation.mutate({
                ownerUserId: auth.userId,
                ownerEmail: auth.email,
                title,
                studyType,
                metric,
                targetValue,
                startsAt,
                endsAt,
              })
            }
          >
            {createMutation.isPending ? "Creating…" : "Create Challenge"}
          </button>
        </div>
      ) : (
        <div className="challenge-form-body">
          <label className="challenge-field">
            <span className="challenge-field-label">Invite code</span>
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={8}
              style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
            />
          </label>

          {joinMutation.error ? <p className="challenge-error">{joinMutation.error.message}</p> : null}

          <button
            type="button"
            className="primary-button"
            disabled={!canJoin}
            onClick={() =>
              joinMutation.mutate({
                userId: auth.userId,
                email: auth.email,
                inviteCode,
              })
            }
          >
            {joinMutation.isPending ? "Joining…" : "Join Challenge"}
          </button>
        </div>
      )}
    </div>
  );
}

function ChallengeDetail({ challengeId, auth }) {
  const [copiedValue, setCopiedValue] = useState("");

  const detailQuery = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => fetchChallenge({ challengeId }),
  });

  const leaderboardQuery = useQuery({
    queryKey: ["challengeLeaderboard", challengeId],
    queryFn: () => fetchChallengeLeaderboard({ challengeId }),
  });

  const myRank = useMemo(() => {
    if (!auth?.userId || !leaderboardQuery.data) return null;
    return leaderboardQuery.data.find((row) => row.userId === auth.userId) ?? null;
  }, [auth?.userId, leaderboardQuery.data]);

  if (detailQuery.isLoading) {
    return <div className="loading-state">Loading challenge…</div>;
  }

  if (detailQuery.isError) {
    return <div className="empty-state">Could not load challenge. Check your connection.</div>;
  }

  if (!detailQuery.data) {
    return <div className="empty-state">Challenge not found.</div>;
  }

  const challenge = detailQuery.data;
  const status = getChallengeStatus(challenge);
  const joinUrl = `${window.location.origin}/challenges?invite=${challenge.inviteCode}`;

  async function handleCopy(kind, value) {
    const didCopy = await copyText(value);
    setCopiedValue(didCopy ? kind : "");
    setTimeout(() => setCopiedValue(""), 1500);
  }

  return (
    <div className="challenge-detail">
      <div className="challenge-detail-header">
        <div className="challenge-detail-meta">
          <div className="challenge-detail-title-row">
            <h2 className="challenge-detail-title">{challenge.title}</h2>
            <StatusBadge status={status} />
          </div>
          <p className="challenge-meta">
            {challenge.studyType} · {challenge.metric.replaceAll("_", " ")} · target <strong>{challenge.targetValue}</strong>
          </p>
          <p className="challenge-meta">
            {formatDate(challenge.startsAt)} → {formatDate(challenge.endsAt)}
          </p>
        </div>

        <div className="challenge-invite-box">
          <span className="challenge-invite-label">Invite code</span>
          <strong className="challenge-invite-code">{challenge.inviteCode}</strong>
          <div className="challenge-copy-actions">
            <button
              type="button"
              className="secondary-button challenge-copy-btn"
              onClick={() => handleCopy("code", challenge.inviteCode)}
            >
              {copiedValue === "code" ? "Code copied" : "Copy code"}
            </button>
            <button
              type="button"
              className="secondary-button challenge-copy-btn"
              onClick={() => handleCopy("link", joinUrl)}
            >
              {copiedValue === "link" ? "Link copied" : "Copy invite link"}
            </button>
          </div>
        </div>
      </div>

      <div className="challenge-panel">
        <div className="challenge-panel-header">
          <h3 className="challenge-panel-title">Leaderboard</h3>
          {myRank ? <span className="challenge-rank-pill">Your rank: #{myRank.rank}</span> : null}
        </div>

        {leaderboardQuery.isLoading ? (
          <div className="loading-state">Loading…</div>
        ) : leaderboardQuery.isError ? (
          <div className="empty-state compact">Failed to load leaderboard.</div>
        ) : leaderboardQuery.data?.length ? (
          <div className="challenge-leaderboard">
            {leaderboardQuery.data.map((row) => (
              <div
                key={row.userId}
                className={`challenge-leaderboard-row ${row.userId === auth?.userId ? "mine" : ""}`}
              >
                <div className="challenge-rank">#{row.rank}</div>
                <div className="challenge-player">
                  <strong>{row.email || row.userId}</strong>
                  <span>
                    {row.correctAnswers} correct · {row.roundsCompleted} rounds
                  </span>
                </div>
                <div className="challenge-score">{row.score}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            {status === "upcoming"
              ? "Challenge hasn't started yet."
              : "No scores yet. Complete a study session to appear here."}
          </div>
        )}
      </div>

      <div className="challenge-panel">
        <h3 className="challenge-panel-title">Participants ({challenge.participants.length})</h3>
        <div className="challenge-participants">
          {challenge.participants.map((participant) => (
            <div
              key={participant.userId}
              className={`challenge-participant ${participant.userId === auth?.userId ? "mine" : ""}`}
            >
              <span className="challenge-participant-name">
                {participant.email || participant.userId}
                {participant.userId === auth?.userId ? <span className="challenge-you-badge">you</span> : null}
              </span>
              <span className="challenge-participant-date">Joined {formatDate(participant.joinedAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChallengeListItem({ challenge, isActive, onOpen }) {
  const [copied, setCopied] = useState(false);
  const status = getChallengeStatus(challenge);

  return (
    <div className={`challenge-list-item ${isActive ? "active" : ""}`}>
      <button type="button" className="challenge-list-item-main" onClick={onOpen}>
        <div className="challenge-list-item-top">
          <span className="challenge-list-item-title">{challenge.title}</span>
          <span className={`challenge-status-dot challenge-status-dot--${status}`} title={status} />
        </div>
        <div className="challenge-list-item-meta">
          <span>{challenge.studyType}</span>
          <span>{challenge.participantCount} {challenge.participantCount === 1 ? "player" : "players"}</span>
          <span>ends {formatDate(challenge.endsAt)}</span>
        </div>
        <div className="challenge-list-item-code">Code: {challenge.inviteCode}</div>
      </button>
      <button
        type="button"
        className="challenge-inline-copy"
        onClick={async () => {
          const didCopy = await copyText(challenge.inviteCode);
          setCopied(didCopy);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function ChallengesView({ auth }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { challengeId } = useParams();

  const listQuery = useQuery({
    queryKey: ["challenges", auth?.userId],
    queryFn: () => fetchChallenges({ userId: auth.userId }),
    enabled: Boolean(auth?.userId),
  });

  if (!auth) {
    return (
      <div className="challenge-page--signed-out">
        <div className="empty-state">Sign in to create or join challenges.</div>
      </div>
    );
  }

  function handleCreated(newId) {
    queryClient.invalidateQueries({ queryKey: ["challenges", auth.userId] });
    navigate(`/challenges/${newId}`);
  }

  function handleJoined(joinedId) {
    queryClient.invalidateQueries({ queryKey: ["challenges", auth.userId] });
    navigate(`/challenges/${joinedId}`);
  }

  return (
    <section className="challenge-page">
      <aside className="challenge-sidebar">
        <div className="challenge-sidebar-header">
          <h2 className="challenge-sidebar-title">My Challenges</h2>
          <button
            type="button"
            className="challenge-new-btn"
            onClick={() => navigate("/challenges")}
            title="Create or join a challenge"
          >
            + New
          </button>
        </div>

        {listQuery.isLoading ? <div className="loading-state">Loading…</div> : null}
        {listQuery.isError ? <div className="empty-state compact">Failed to load challenges.</div> : null}
        {!listQuery.isLoading && listQuery.data?.length === 0 ? <div className="empty-state compact">No challenges yet.</div> : null}

        {listQuery.data?.length ? (
          <div className="challenge-list">
            {listQuery.data.map((challenge) => (
              <ChallengeListItem
                key={challenge.challengeId}
                challenge={challenge}
                isActive={challenge.challengeId === challengeId}
                onOpen={() => navigate(`/challenges/${challenge.challengeId}`)}
              />
            ))}
          </div>
        ) : null}
      </aside>

      <main className="challenge-main">
        {challengeId ? (
          <ChallengeDetail challengeId={challengeId} auth={auth} />
        ) : (
          <NewChallengePanel auth={auth} onCreated={handleCreated} onJoined={handleJoined} />
        )}
      </main>
    </section>
  );
}
