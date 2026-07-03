const translations = {
  en: {
    title: "Jim and Fangzhuo",
    username: "Username",
    password: "Password",
    enterUsername: "Enter username",
    enterPassword: "Enter password",
    login: "Login",
    home: "Home",
    logout: "Logout",
    loginFailed: "Login failed. Please check credentials.",
    failedToLoadAlbums: "Failed to load albums.",
    albumNotFound: (name: string) => `Album "${name}" not found.`,
    albumPhoto: "Album photo",
    incorrectCredentials: "Incorrect username or password.",
    networkError: "Network error. Please check your connection.",
  },
  zh: {
    title: "Jim 和 芳卓",
    username: "用户名",
    password: "密码",
    enterUsername: "输入用户名",
    enterPassword: "输入密码",
    login: "登录",
    home: "首页",
    logout: "退出登录",
    loginFailed: "登录失败，请检查用户名和密码。",
    failedToLoadAlbums: "加载相册失败。",
    albumNotFound: (name: string) => `未找到相册 "${name}"。`,
    albumPhoto: "相册照片",
    incorrectCredentials: "用户名或密码错误。",
    networkError: "网络错误，请检查网络连接。",
  }
};

export type Language = "en" | "zh";

let currentLang: Language = "en";

const detectLanguage = (): Language => {
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get("lang")?.toLowerCase();
  if (langParam === "zh" || langParam === "cn") {
    return "zh";
  }
  if (langParam === "en") {
    return "en";
  }

  const languages = navigator.languages || [navigator.language];
  for (const lang of languages) {
    if (lang.startsWith("zh")) {
      return "zh";
    }
  }
  return "en";
};

currentLang = detectLanguage();

// Set html lang attribute for SEO and accessibility
document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";

export const t = <K extends keyof typeof translations.en>(
  key: K,
  ...args: K extends "albumNotFound" ? [string] : []
): string => {
  const entry = translations[currentLang][key];
  if (typeof entry === "function") {
    return (entry as any)(...args);
  }
  return entry as string;
};

export const translateStaticDOM = () => {
  // Page Title
  document.title = t("title");

  // Login Form Labels & Placeholders
  const usernameLabel = document.querySelector('label[for="username"]');
  if (usernameLabel) usernameLabel.textContent = t("username");

  const usernameInput = document.getElementById("username") as HTMLInputElement;
  if (usernameInput) usernameInput.placeholder = t("enterUsername");

  const passwordLabel = document.querySelector('label[for="password"]');
  if (passwordLabel) passwordLabel.textContent = t("password");

  const passwordInput = document.getElementById("password") as HTMLInputElement;
  if (passwordInput) passwordInput.placeholder = t("enterPassword");

  const loginBtnText = document.querySelector('#login-btn .btn-text');
  if (loginBtnText) loginBtnText.textContent = t("login");

  // Main UI Navigation Buttons
  const homeBtn = document.getElementById("home-btn");
  if (homeBtn) homeBtn.textContent = t("home");

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) logoutBtn.textContent = t("logout");
};

export const translateError = (error: unknown): string => {
  const defaultMsg = t("loginFailed");
  if (!error) return defaultMsg;

  let msg = "";
  if (error instanceof Error) {
    msg = error.message;
  } else if (typeof error === "string") {
    msg = error;
  } else {
    return defaultMsg;
  }

  const lowerMsg = msg.toLowerCase();
  // Standard Cognito credentials check
  if (lowerMsg.includes("incorrect") && (lowerMsg.includes("username") || lowerMsg.includes("password"))) {
    return t("incorrectCredentials");
  }
  if (lowerMsg.includes("user does not exist") || lowerMsg.includes("usernotfoundexception")) {
    return t("incorrectCredentials");
  }
  if (lowerMsg.includes("network error") || lowerMsg.includes("failed to fetch")) {
    return t("networkError");
  }

  return msg;
};
