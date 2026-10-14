import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { BlueprintProvider } from "./state/BlueprintContext";
import { routeTree } from "./routes";
import "./styles.css";

// TanStack Router owns navigation while the provider keeps the editable YAML
// available to both routes without a server or database.
const router = createRouter({ routeTree });
// TanStack Query caches backend data and gives mutations a shared refresh path.
const queryClient = new QueryClient();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BlueprintProvider>
      <RouterProvider router={router} />
    </BlueprintProvider>
  </QueryClientProvider>,
);
