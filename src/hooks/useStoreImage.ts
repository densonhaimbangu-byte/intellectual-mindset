import { useEffect, useState } from "react";
import { resolveFileUrl } from "@/lib/store";

/** Resolves an external URL or a private-storage object path to a viewable URL. */
export function useStoreImage(bucket: string, value: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(
    value && /^https?:\/\//.test(value) ? value : null,
  );

  useEffect(() => {
    let active = true;
    if (!value) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//.test(value)) {
      setUrl(value);
      return;
    }
    resolveFileUrl(bucket, value).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [bucket, value]);

  return url;
}
