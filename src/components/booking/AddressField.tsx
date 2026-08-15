import * as React from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlaces, searchRegion, type PlaceSuggestion } from "@/lib/places.functions";
import { Input } from "@/components/ui/input";

export function AddressField({
  id,
  value,
  onChange,
  onLoadingChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onLoadingChange?: ((loading: boolean) => void) | undefined;
}) {
  const search = useServerFn(searchPlaces);
  const regionSearch = useServerFn(searchRegion);
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [fallbackQuery, setFallbackQuery] = React.useState("");
  const [fallbackResults, setFallbackResults] = React.useState<PlaceSuggestion[] | null>(null);
  const [fallbackLoading, setFallbackLoading] = React.useState(false);
  const justPicked = React.useRef(false);
  const cache = React.useRef(new Map<string, PlaceSuggestion[]>());
  const seq = React.useRef(0);

  // Notify parent whenever the fetching state changes.
  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const resetFallback = React.useCallback(() => {
    setFailed(false);
    setFallbackResults(null);
    setFallbackLoading(false);
  }, []);

  const pick = (description: string) => {
    justPicked.current = true;
    onChange(description);
    setOpen(false);
    setSuggestions([]);
    resetFallback();
  };

  React.useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setFailed(false);
      return;
    }

    const cached = cache.current.get(q.toLowerCase());
    if (cached) {
      setSuggestions(cached);
      setOpen(cached.length > 0);
      setLoading(false);
      setFailed(cached.length === 0);
      return;
    }

    let cancelled = false;
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(() => {
      search({ data: { query: q } })
        .then((res) => {
          cache.current.set(q.toLowerCase(), res);
          if (!cancelled && id === seq.current) {
            setSuggestions(res);
            setOpen(res.length > 0);
            setLoading(false);
            setFailed(res.length === 0);
          }
        })
        .catch(() => {
          if (!cancelled && id === seq.current) {
            setSuggestions([]);
            setLoading(false);
            setFailed(true);
          }
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value, search]);

  const runFallback = () => {
    const q = fallbackQuery.trim();
    if (q.length < 2 || fallbackLoading) return;
    setFallbackLoading(true);
    regionSearch({ data: { query: q } })
      .then((res) => {
        setFallbackResults(res);
        setFallbackLoading(false);
      })
      .catch(() => {
        setFallbackResults([]);
        setFallbackLoading(false);
      });
  };

  return (
    <div className="relative">
      <div className="relative mt-2">
        <MapPin
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          type="text"
          autoComplete="off"
          placeholder="Start typing a venue or address"
          maxLength={240}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="soft-inset h-14 rounded-[16px] border-border bg-background pl-11 pr-11 text-base"
          aria-busy={loading}
        />
        {loading ? (
          <Loader2
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {open && suggestions.length > 0 ? (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-[18px] border border-border bg-background shadow-lg">
          {suggestions.map((s) => (
            <li key={s.description}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s.description)}
                className="block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
              >
                {s.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {loading && !open ? (
        <p className="mt-2 pl-1 text-[11px] text-muted-foreground" role="status">
          Searching addresses…
        </p>
      ) : null}

      {failed && !loading ? (
        <div className="mt-3 rounded-[18px] border border-border bg-muted/40 p-4" role="region">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            No matches
          </p>
          <p className="mt-1 text-sm text-foreground">
            Search by ZIP code or city, state instead.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              type="text"
              inputMode="text"
              placeholder="33139 or Miami Beach, FL"
              maxLength={80}
              value={fallbackQuery}
              onChange={(e) => setFallbackQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runFallback();
                }
              }}
              className="h-12 rounded-[14px] border-border bg-background text-sm"
            />
            <button
              type="button"
              onClick={runFallback}
              disabled={fallbackQuery.trim().length < 2 || fallbackLoading}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-foreground px-5 text-[11px] uppercase tracking-[0.14em] text-background transition-opacity disabled:opacity-40"
            >
              {fallbackLoading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-3.5" aria-hidden="true" />
              )}
              Search
            </button>
          </div>

          {fallbackResults && fallbackResults.length > 0 ? (
            <ul className="mt-3 overflow-hidden rounded-[14px] border border-border bg-background">
              {fallbackResults.map((s) => (
                <li key={s.description}>
                  <button
                    type="button"
                    onClick={() => pick(s.description)}
                    className="block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                  >
                    {s.description}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {fallbackResults && fallbackResults.length === 0 && !fallbackLoading ? (
            <p className="mt-3 text-[12px] text-muted-foreground">
              Nothing found in Florida for that. You can keep the address exactly as typed.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => pick(value.trim())}
            className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4"
          >
            Use address as typed
          </button>
        </div>
      ) : null}
    </div>
  );
}
