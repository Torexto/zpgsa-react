import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapContainer from "./map/MapContainer.tsx";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapContainer />
    </QueryClientProvider>
  );
}
