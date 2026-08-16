import { useEffect, useRef, useState } from "react";

/**
 * Canvas signature capture — finger, stylus, mouse. Emits a PNG data URL
 * on every stroke end, and null when cleared.
 */
export function SignaturePad({
  onChange,
  label = "Sign here",
}: {
  onChange: (dataUrl: string | null) => void;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111111";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    if (!dirty.current) return;
    setHasInk(true);
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
    setHasInk(false);
    onChange(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="label-caps text-[10px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={clear}
          className="label-caps text-[10px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      </div>

      <div className="soft-inset relative mt-3 rounded-[16px] border border-border bg-card">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          className="h-40 w-full touch-none rounded-[16px]"
          aria-label="Signature canvas"
        />
        {!hasInk ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-6 px-4 text-center text-[11px] leading-snug text-muted-foreground sm:text-sm">
            Draw your signature with a finger, stylus, or mouse
          </span>
        ) : null}
        <div className="pointer-events-none absolute inset-x-6 bottom-5 border-b border-border" />
      </div>
    </div>
  );
}
