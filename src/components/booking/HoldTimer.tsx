import { useEffect, useRef, useState } from "react";
import { holdExpiresAt } from "@/lib/hold";

export function HoldTimer({
  signedAt,
  onExpired,
}: {
  signedAt: string;
  onExpired?: () => void;
}) {
  const expires = holdExpiresAt(signedAt).getTime();
  const [remainingMs, setRemainingMs] = useState(() => expires - Date.now());
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => setRemainingMs(expires - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expires]);

  useEffect(() => {
    if (remainingMs > 0 || expiredRef.current) return;
    expiredRef.current = true;
    onExpired?.();
  }, [remainingMs, onExpired]);

  if (remainingMs <= 0) {
    return <>Your hold ended. Sign again to reserve this time.</>;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const clock = `${minutes}:${`${seconds}`.padStart(2, "0")}`;

  return (
    <>
      Your date is held{" "}
      <span className="tabular-nums text-foreground">{clock}</span>. Payment confirms the
      booking — choose deposit or pay in full below.
    </>
  );
}
