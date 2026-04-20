import { useState } from "react";

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(
    text.startsWith("<!DOCTYPE") || text.startsWith("<html")
      ? "Sign-in endpoint returned HTML instead of JSON. Check that the backend is running on port 4000 and the Vite /api proxy is working."
      : text || "Unexpected response from server"
  );
}

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Failed to send link");
      }

      setSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card login-modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {sent ? (
          <div className="login-sent">
            <div className="login-sent-icon">📬</div>
            <h3>Check your email</h3>
            <p>
              We sent a magic link to <strong>{email}</strong>.
            </p>
            <p className="login-sent-note">Click the link to sign in. It expires in 15 minutes.</p>
          </div>
        ) : (
          <>
            <div className="login-modal-header">
              <h3>Sign in</h3>
              <p>Enter your email and we'll send you a sign-in link — no password needed.</p>
            </div>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="login-email-input"
                autoFocus
              />
              {error ? <p className="login-error">{error}</p> : null}
              <button
                type="submit"
                className="practice-primary-button"
                disabled={loading || !email}
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
