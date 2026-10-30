import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    root.innerHTML = `<pre style="padding:20px;color:red">${error instanceof Error ? error.stack : String(error)}</pre>`;
  }
}
