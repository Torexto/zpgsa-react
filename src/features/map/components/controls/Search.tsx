import { type Signal, useSignal } from "@preact/signals-react";
import { useQuery } from "@tanstack/react-query";
import type { MapRef } from "@vis.gl/react-maplibre";
import { clsx } from "clsx";
import Fuse, { type IFuseOptions } from "fuse.js";
import { useEffect, useMemo, useRef } from "react";
import { getStopsQueryOptions } from "@/features/map/api";
import type { Stop } from "@/features/map/types.ts";

const fuseOptions: IFuseOptions<Stop> = {
  keys: ["city", "name"],
  threshold: 0.35,
  includeScore: true,
};

const fuseSearchOptions = { limit: 10 };

export function SearchModal({
  map,
  isSearchModalOpen,
}: {
  map: MapRef | null;
  isSearchModalOpen: Signal<boolean>;
}) {
  const { data: stops, isPending, isError } = useQuery(getStopsQueryOptions());
  const fuse = useMemo(() => new Fuse(stops ?? [], fuseOptions), [stops]);

  const inputValue = useSignal("");
  const inputRef = useRef<HTMLInputElement>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const activeIndex = useSignal(-1);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const query = inputValue.value.trim();

  const results = useMemo(
    () => (query ? fuse.search(query, fuseSearchOptions) : []),
    [query, fuse],
  );

  useEffect(() => {
    if (activeIndex.value < 0) return;

    const activeStop = results[activeIndex.value];

    if (!activeStop) return;

    const container = resultsRef.current;
    const element = container?.querySelector<HTMLElement>(
      `#stop-option-${CSS.escape(String(activeStop.item.id))}`,
    );

    if (!container || !element) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    if (elementRect.bottom > containerRect.bottom) {
      container.scrollTop += elementRect.bottom - containerRect.bottom;
    } else if (elementRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - elementRect.top;
    }
  }, [activeIndex.value, results]);

  const selectStop = (stop: Stop) => {
    if (!map) return;

    if (!Number.isFinite(stop.lon) || !Number.isFinite(stop.lat)) {
      return;
    }

    map?.flyTo({
      center: [stop.lon, stop.lat],
      zoom: 15,
    });

    isSearchModalOpen.value = false;
  };

  const onSubmit = () => {
    const result = results[activeIndex.value] ?? results[0];

    if (!result) return;

    selectStop(result.item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Zamknij wyszukiwarkę"
        className="absolute inset-0 size-full cursor-default bg-black/30"
        onClick={() => {
          isSearchModalOpen.value = false;
        }}
      />

      <search
        aria-label="Wyszukiwarka przystanków"
        className="
        absolute left-1/2 top-[50dvh] z-50
        w-[calc(100%-2rem)] max-w-md
        -translate-x-1/2 -translate-y-1/2
        overflow-hidden rounded-3xl
        border border-white/10
        bg-zinc-950/90 text-white
        shadow-2xl shadow-black/40
        backdrop-blur-xl
      "
      >
        <form onSubmit={onSubmit} className="w-full">
          <div className="flex items-center gap-3 px-4">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-5 shrink-0 text-zinc-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              placeholder="Nazwa przystanku lub miasto..."
              aria-controls="stop-search-results-list"
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex.value >= 0 && results[activeIndex.value]
                  ? `stop-option-${results[activeIndex.value].item.id}`
                  : undefined
              }
              aria-label="Search stops"
              value={inputValue.value}
              onChange={(event) => {
                inputValue.value = event.currentTarget.value;
                activeIndex.value = -1;
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && results.length > 0) {
                  event.preventDefault();

                  activeIndex.value =
                    activeIndex.value >= results.length - 1
                      ? 0
                      : activeIndex.value + 1;
                }

                if (event.key === "ArrowUp" && results.length > 0) {
                  event.preventDefault();

                  activeIndex.value =
                    activeIndex.value <= 0
                      ? results.length - 1
                      : activeIndex.value - 1;
                }

                if (event.key === "Escape") {
                  isSearchModalOpen.value = false;
                }
              }}
              className={clsx(
                `
              h-16 min-w-0 flex-1
              bg-transparent py-4
              text-base text-white
              outline-none
            `,
                "placeholder:text-zinc-500",
              )}
            />

            {query && (
              <button
                type="button"
                aria-label="Wyczyść"
                onClick={() => {
                  inputValue.value = "";
                }}
                className="
                flex size-8 shrink-0 items-center justify-center
                rounded-full text-xl text-zinc-400 cursor-pointer
                transition hover:bg-white/10 hover:text-white
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-sky-400
              "
              >
                ×
              </button>
            )}
          </div>

          <div
            id="stop-search-results"
            aria-live="polite"
            className="border-t border-white/10 p-2"
          >
            {isError ? (
              <p className="px-3 py-5 text-center text-sm text-red-300">
                Nie można załadować przystanków. Spróbuj ponownie później.
              </p>
            ) : query ? (
              isPending ? (
                <p className="px-3 py-5 text-center text-sm text-zinc-400">
                  Ładowanie przystanków...
                </p>
              ) : results.length > 0 ? (
                <div
                  ref={resultsRef}
                  id="stop-search-results-list"
                  role="listbox"
                  aria-label="Wyniki wyszukiwania"
                  className="max-h-80 space-y-1 overflow-y-auto"
                >
                  {results.map(({ item }, index) => (
                    <button
                      key={item.id}
                      id={`stop-option-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex.value === index}
                      tabIndex={-1}
                      onMouseMove={() => (activeIndex.value = index)}
                      onClick={() => selectStop(item)}
                      className={`
                      flex w-full items-center justify-between gap-3
                      rounded-2xl px-3 py-3 text-left cursor-pointer
                      transition-colors
                      focus-visible:outline-none
                      ${
                        activeIndex.value === index
                          ? "bg-white/10 ring-2 ring-inset ring-sky-400"
                          : "hover:bg-white/10"
                      }
                     `}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          aria-hidden="true"
                          className="
                            flex size-10 shrink-0 items-center justify-center
                            rounded-xl border border-sky-400/20
                            bg-sky-400/10 text-sky-300
                          "
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="size-5"
                          >
                            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-medium text-zinc-100">
                            {item.name}
                          </div>
                          <div className="truncate text-sm text-zinc-400">
                            {item.city}
                          </div>
                        </div>
                      </div>

                      <span
                        className="
                          shrink-0 rounded-lg border border-white/5
                          bg-white/5 px-2 py-1
                          font-mono text-xs text-zinc-500
                        "
                      >
                        #{item.id}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm font-medium text-zinc-300">
                    Nie znaleziono przystanków
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Spróbuj inną nazwę lub miasto.
                  </p>
                </div>
              )
            ) : (
              <p className="px-3 py-4 text-sm text-zinc-400">
                Zacznij pisać nazwę przystanku lub miasto.
              </p>
            )}
          </div>

          <div
            className="
            flex items-center justify-between gap-3
            border-t border-white/10 px-4 py-3
            text-xs text-zinc-500
          "
          >
            <span>
              {query && !isPending && !isError
                ? `${results.length} results`
                : "Wyszukaj przystanki"}
            </span>

            <div className="flex items-center gap-2">
              <span>
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-1 font-mono text-zinc-300">
                  Enter
                </kbd>{" "}
                wybierz
              </span>
              <span>
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-1 font-mono text-zinc-300">
                  Esc
                </kbd>{" "}
                zamknij
              </span>
            </div>
          </div>
        </form>
      </search>
    </div>
  );
}
