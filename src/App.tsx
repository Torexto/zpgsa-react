import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import MapContainer from "./map/MapContainer.tsx";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      <MapContainer />
    </QueryClientProvider>
  );
}
