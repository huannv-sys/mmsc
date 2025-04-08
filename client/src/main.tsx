import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { WebSocketProvider } from "./lib/websocket-context";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <WebSocketProvider>
      <App />
      <Toaster />
    </WebSocketProvider>
  </QueryClientProvider>,
);
