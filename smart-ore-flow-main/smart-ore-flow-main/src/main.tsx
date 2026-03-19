import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress browser extension errors (React DevTools, Redux DevTools, etc.)
window.addEventListener("error", (event) => {
  // Suppress extension context invalidated errors
  if (
    event.message?.includes("Extension context invalidated") ||
    event.message?.includes("polyfill.js") ||
    event.message?.includes("cdp-session") ||
    event.filename?.includes("chrome-extension://") ||
    event.filename?.includes("moz-extension://") ||
    event.filename?.includes("safari-extension://")
  ) {
    event.preventDefault();
    return false;
  }
});

// Suppress unhandled promise rejections from extensions
window.addEventListener("unhandledrejection", (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || "";
  
  if (
    errorMessage.includes("Extension context invalidated") ||
    errorMessage.includes("polyfill.js") ||
    errorMessage.includes("cdp-session") ||
    errorMessage.includes("chrome-extension://") ||
    errorMessage.includes("moz-extension://") ||
    errorMessage.includes("safari-extension://")
  ) {
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
