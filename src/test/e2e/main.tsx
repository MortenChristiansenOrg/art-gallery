/**
 * E2E test entry point
 * Renders App with a fake Convex client for deterministic testing
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { ConvexReactClient } from "convex/react";
import App from "../../App";
import { fakeConvexClient } from "./fakeConvexClient";
import "../../index.css";

// Cast fake client to ConvexReactClient type
// The fake implements the necessary interface methods
const client = fakeConvexClient as unknown as ConvexReactClient;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App client={client} />
  </StrictMode>
);
