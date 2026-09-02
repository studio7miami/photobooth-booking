import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export const MOTION_VARIANTS = ["rise", "soft", "slide"] as const;
export type MotionVariant = (typeof MOTION_VARIANTS)[number];

export const MOTION_VARIANT_META: Record<MotionVariant, { letter: string; label: string; note: string }> =
  {
    rise: {
      letter: "A",
      label: "Rise",
      note: "Fade up, one after another. The quiet sequential default.",
    },
    soft: {
      letter: "B",
      label: "Soft",
      note: "Slight scale and blur that settles into place.",
    },
    slide: {
      letter: "C",
      label: "Sweep",
      note: "A quicker left-to-right cascade.",
    },
  };

type MotionContextValue = {
  variant: MotionVariant;
};

const MotionContext = createContext<MotionContextValue>({ variant: "rise" });

export function MotionProvider({
  variant,
  replayKey,
  children,
}: {
  variant: MotionVariant;
  replayKey?: string | number;
  children: ReactNode;
}) {
  return (
    <MotionContext.Provider value={{ variant }}>
      <div key={replayKey ?? 0}>{children}</div>
    </MotionContext.Provider>
  );
}

export function useMotionVariant(): MotionVariant {
  return useContext(MotionContext).variant;
}

export function parseMotionVariant(raw: string | null | undefined): MotionVariant | null {
  const key = raw?.trim().toLowerCase();
  if (key === "a" || key === "rise") return "rise";
  if (key === "b" || key === "soft") return "soft";
  if (key === "c" || key === "slide" || key === "sweep") return "slide";
  return null;
}

export function MotionEnter({
  delayMs = 0,
  whenVisible = false,
  className,
  children,
}: {
  delayMs?: number;
  /** Wait until this node enters the viewport before rising. */
  whenVisible?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const variant = useMotionVariant();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!whenVisible);

  useEffect(() => {
    if (!whenVisible) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [whenVisible]);

  return (
    <div
      ref={ref}
      className={cn(visible ? ["s7-enter", `s7-enter-${variant}`] : "opacity-0", className)}
      style={visible ? ({ animationDelay: `${delayMs}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
