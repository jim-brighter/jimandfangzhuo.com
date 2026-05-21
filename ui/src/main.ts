import { initAuth } from "./auth";
import { homeButton } from "./navigation";
import { handleRoute } from "./router";

initAuth()

homeButton.addEventListener("click", (event) => {
  event.preventDefault();
  history.pushState(null, "", "/");
  handleRoute("/");
});

// Listen to navigation events (Back/Forward)
window.addEventListener("popstate", () => {
  handleRoute(window.location.pathname);
});

// Initialize Route
handleRoute(window.location.pathname);
