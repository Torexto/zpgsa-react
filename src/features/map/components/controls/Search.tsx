import { type Signal, useSignal } from "@preact/signals-react";
import { useQuery } from "@tanstack/react-query";
import type { MapRef } from "@vis.gl/react-maplibre";
import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
import type * as React from "react";
import { useMemo } from "react";
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
  const query = inputValue.value.trim();

  const results = useMemo(
    () => (query ? fuse.search(query, fuseSearchOptions) : []),
    [query, fuse],
  );

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

  const onSubmit = (event: React.SubmitEvent) => {
    event.preventDefault();

    const firstResult = results[0];

    if (!firstResult) return;

    selectStop(firstResult.item);
  };

  return (
    <form
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:w-96 bg-zinc-800/80 rounded-4xl"
      onSubmit={onSubmit}
    >
      <input
        type="text"
        placeholder="Search..."
        className="w-full h-18 rounded-4xl outline-none focus-visible:border focus-visible:border-white text-xl text-white p-4"
        value={inputValue.value}
        onChange={(e) => (inputValue.value = e.target.value)}
      />
      {results.length > 0 && (
        <div className="w-full rounded-b-4xl text-white p-4 flex flex-col gap-y-2">
          {results.map((result) => (
            <button
              type="button"
              key={result.item.id}
              className="flex gap-x-1 cursor-pointer text-lg bg-zinc-800/40 rounded-full py-1 px-3 w-full"
              onClick={() => selectStop(result.item)}
            >
              <div>{result.item.city}</div>
              <div>{result.item.name}</div>
              <div>{result.item.id}</div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
