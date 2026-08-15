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
    return (
      <p className="text-xs text-muted-foreground">
        Hold ended. Sign again to reserve this time.
      </p>
    );
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <p className="text-xs tabular-nums text-muted-foreground">
      This time is held for {minutes}:{`${seconds}`.padStart(2, "0")}
    </p>
  );
}
