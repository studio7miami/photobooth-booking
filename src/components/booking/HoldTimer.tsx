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
      <div className="rounded-[16px] border border-border bg-muted/60 px-4 py-3">
        <p className="text-sm font-medium">Your hold ended</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Sign again to reserve this time.</p>
      </div>
    );
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const clock = `${minutes}:${`${seconds}`.padStart(2, "0")}`;

  return (
    <div className="rounded-[16px] border border-foreground/15 bg-foreground px-4 py-3 text-background">
      <p className="label-caps text-[10px] tracking-[0.14em] text-background/70">Hold</p>
      <p className="mt-1 text-base font-medium leading-tight">
        Your booking is held for{" "}
        <span className="tabular-nums">{clock}</span>
      </p>
    </div>
  );
}
