import toBus from "../map/toBus.ts";
import type { Route, Stop, StopInfoBus, ZpgsaBus } from "../map/types.ts";

async function fetchData(endpoint: string) {
  return fetch(endpoint).then((r) => r.json());
}

export const getStopsQueryOptions = () => ({
  queryKey: ["stops"],
  queryFn: () =>
    fetchData("assets/data/stops.json").then((data: Stop[]) => data),
});

export function getBusesQueryOptions() {
  return {
    queryKey: ["buses"],
    queryFn: () =>
      fetchData("/api/buses").then((data: ZpgsaBus[]) => data.map(toBus)),
    refetchInterval: 3000,
  };
}

export function getRoutesQueryOptions() {
  return {
    queryKey: ["routes"],
    queryFn: () =>
      fetchData("assets/data/routes.json").then(
        (data: Record<string, Route>) => data,
      ),
  };
}

export function getStopInfoOptions() {
  return {
    queryKey: ["stops-info"],
    queryFn: () =>
      fetchData("/assets/data/stop_details.json").then(
        (data: Record<string, StopInfoBus[]>) => data,
      ),
  };
}
