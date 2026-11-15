import { useEffect, useState } from "react";

const KEY = "im-favorites";
const EVENT = "im-favorites-change";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Saved-favourite products, shared across the site and kept in the browser. */
export function useFavorite(id: string) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const sync = () => setLiked(read().includes(id));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  const toggle = () => {
    const list = read();
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  };

  return { liked, toggle };
}
