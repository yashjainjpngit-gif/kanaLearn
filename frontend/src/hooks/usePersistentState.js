import { useEffect, useState } from "react";

function resolveInitialValue(initialValue) {
  return typeof initialValue === "function" ? initialValue() : initialValue;
}

function readStoredValue(storageKey, initialValue) {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === null) {
    return resolveInitialValue(initialValue);
  }

  try {
    return JSON.parse(stored);
  } catch {
    return stored;
  }
}

export default function usePersistentState(storageKey, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(storageKey, initialValue));

  useEffect(() => {
    setValue(readStoredValue(storageKey, initialValue));
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue];
}
