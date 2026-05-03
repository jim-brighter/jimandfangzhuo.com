import { Amplify } from "aws-amplify";
import { checkAuthSession, doLogin, doLogout } from "./auth";
import { getAllAlbums } from "./client";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-west-2_TdfpNx8YV",
      userPoolClientId: "65frmc7qe1ah5r3trjs0f682du"
    }
  }
});

const loginForm = document.getElementById("login") as HTMLFormElement;
const logoutButton = document.getElementById("logout") as HTMLButtonElement;
const welcomeHeader = document.getElementById("welcome") as HTMLDivElement;

const setContent = async () => {
  const isLoggedIn = await checkAuthSession();

  if (isLoggedIn) {
    loginForm.hidden = true;
    welcomeHeader.hidden = false;

    getAllAlbums();
  } else {
    loginForm.hidden = false;
    welcomeHeader.hidden = true;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const username = data.get("username") as string;
  const password = data.get("password") as string;

  await doLogin(username, password);

  setContent();
});

logoutButton.addEventListener("click", async () => {
  await doLogout();

  setContent();
});

setContent();
