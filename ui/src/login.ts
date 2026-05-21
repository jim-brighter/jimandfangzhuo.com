import { doLogin, doLogout } from "./auth";
import { clearCachedAlbums } from "./image-manager";
import { handleRoute } from "./router";

export const loginForm = document.getElementById("login") as HTMLFormElement;
const loginError = document.getElementById("login-error") as HTMLDivElement;
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const btnText = loginBtn?.querySelector(".btn-text") as HTMLSpanElement;
const btnLoader = loginBtn?.querySelector(".btn-loader") as HTMLDivElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

const logoutButton = document.getElementById("logout") as HTMLButtonElement;

const clearError = () => {
  if (loginError) {
    loginError.hidden = true;
    loginError.textContent = "";
  }
};

usernameInput?.addEventListener("input", clearError);
passwordInput?.addEventListener("input", clearError);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const username = data.get("username") as string;
  const password = data.get("password") as string;

  if (loginError) {
    loginError.hidden = true;
    loginError.textContent = "";
  }
  if (loginBtn) {
    loginBtn.disabled = true;
  }
  if (btnText) btnText.style.opacity = "0";
  if (btnLoader) btnLoader.hidden = false;

  try {
    await doLogin(username, password);
    if (loginBtn) loginBtn.disabled = false;
    if (btnText) btnText.style.opacity = "1";
    if (btnLoader) btnLoader.hidden = true;
    handleRoute(window.location.pathname);
  } catch (error) {
    console.error("Login failed:", error);
    if (loginBtn) loginBtn.disabled = false;
    if (btnText) btnText.style.opacity = "1";
    if (btnLoader) btnLoader.hidden = true;

    if (loginError) {
      loginError.hidden = false;
      loginError.textContent = error instanceof Error ? error.message : "Login failed. Please check credentials.";
    } else {
      alert("Login failed. Please check credentials.");
    }
  }
});

logoutButton.addEventListener("click", async () => {
  await doLogout();
  clearCachedAlbums();
  history.replaceState(null, "", "/");
  handleRoute("/");
});
