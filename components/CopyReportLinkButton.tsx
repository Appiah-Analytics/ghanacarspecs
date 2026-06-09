"use client";

import { useState } from "react";

type CopyReportLinkButtonProps = {
  className?: string;
};

export function CopyReportLinkButton({ className }: CopyReportLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onCopy() {
    setFailed(false);
    setCopied(false);

    try {
      if (!navigator.clipboard?.writeText) {
        setFailed(true);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  const label = copied ? "Link copied" : failed ? "Copy unavailable" : "Copy report link";

  return (
    <button type="button" className={className ?? "copy-report-link-btn"} onClick={onCopy}>
      {label}
    </button>
  );
}
