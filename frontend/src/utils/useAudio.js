import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for Japanese text-to-speech using the Web Speech API.
 * Returns { speak, stop, speaking, supported }.
 */
export default function useAudio() {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const speak = useCallback(
    (text, { rate = 0.85, pitch = 1 } = {}) => {
      if (!supported || !text) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported]
  );

  return { speak, stop, speaking, supported };
}
