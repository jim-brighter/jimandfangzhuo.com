import { Amplify } from "aws-amplify";
import { checkAuthSession, doLogin, doLogout } from "./auth";
import { getAllAlbums, getOneAlbum } from "./client";
import type { AlbumImage } from "./client";
import type { Album } from "./album";

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
const mainContainer = document.getElementById("main") as HTMLDivElement;
const albumContainer = document.getElementById("album-container") as HTMLDivElement;
const imagesContainer = document.getElementById("images-container") as HTMLDivElement;
const homeButton = document.getElementById("home-btn") as HTMLButtonElement;

const loginError = document.getElementById("login-error") as HTMLDivElement;
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const btnText = loginBtn?.querySelector(".btn-text") as HTMLSpanElement;
const btnLoader = loginBtn?.querySelector(".btn-loader") as HTMLDivElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

let cachedAlbums: Album[] | null = null;
let currentNextPageToken: string | undefined = undefined;
let isLoadingMore = false;
let intersectionObserver: IntersectionObserver | null = null;
let imageObserver: IntersectionObserver | null = null;

const PLACEHOLDER_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const cleanupPagination = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
  if (imageObserver) {
    imageObserver.disconnect();
    imageObserver = null;
  }
  currentNextPageToken = undefined;
  isLoadingMore = false;

  const sentinel = document.getElementById("scroll-sentinel");
  if (sentinel) {
    sentinel.remove();
  }
};

const renderImages = (images: AlbumImage[], beforeElement?: HTMLElement) => {
  if (!imageObserver) {
    imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const img = entry.target as HTMLImageElement;
        if (entry.isIntersecting) {
          const targetSrc = img.dataset.src;
          if (targetSrc && img.src !== targetSrc) {
            img.src = targetSrc;
          }
        } else {
          if (img.src && img.src !== PLACEHOLDER_GIF) {
            img.src = PLACEHOLDER_GIF;
          }
        }
      });
    }, {
      rootMargin: "800px" // Preemptively load images 800px before they enter viewport
    });
  }

  images.forEach(image => {
    const imageImg = document.createElement("img");
    imageImg.dataset.src = image.thumbnailUrl;
    imageImg.dataset.original = image.originalUrl;
    imageImg.src = PLACEHOLDER_GIF;
    imageImg.loading = "lazy";
    imageImg.decoding = "async";

    imageImg.onerror = () => {
      imageImg.onerror = null;
      imageImg.dataset.src = image.originalUrl;
      imageImg.src = image.originalUrl;
    };

    if (beforeElement) {
      imagesContainer.insertBefore(imageImg, beforeElement);
    } else {
      imagesContainer.appendChild(imageImg);
    }

    imageObserver?.observe(imageImg);
  });
};

const getAlbums = async (): Promise<Album[]> => {
  if (!cachedAlbums) {
    cachedAlbums = await getAllAlbums();
  }
  return cachedAlbums;
};

const handleRoute = async (path: string) => {
  cleanupPagination();
  const isLoggedIn = await checkAuthSession();

  if (!isLoggedIn) {
    loginForm.hidden = false;
    mainContainer.hidden = true;
    albumContainer.innerHTML = "";
    imagesContainer.innerHTML = "";
    cachedAlbums = null;
    return;
  }

  loginForm.hidden = true;
  mainContainer.hidden = false;

  // Clean trailing slash if present (except for root path)
  const cleanPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  // Decode the album name from pathname, removing leading slash
  const albumNameFromPath = decodeURIComponent(cleanPath.slice(1)).trim();

  if (!albumNameFromPath) {
    // Show Album List (Home)
    homeButton.hidden = true;
    albumContainer.hidden = false;
    imagesContainer.hidden = true;
    imagesContainer.innerHTML = "";

    try {
      const albums = await getAlbums();
      albumContainer.innerHTML = ""; // Clear loader/previous list

      albums.forEach(album => {
        const albumCard = document.createElement("div");
        albumCard.className = "album-card";

        const albumImage = document.createElement("img");
        albumImage.src = album.presignedUrl;
        albumImage.alt = album.albumName;

        const albumLabel = document.createElement("div");
        albumLabel.className = "album-label";
        albumLabel.textContent = album.albumName;

        albumCard.appendChild(albumImage);
        albumCard.appendChild(albumLabel);

        albumCard.addEventListener("click", (event) => {
          event.preventDefault();
          const newPath = `/${encodeURIComponent(album.albumName)}`;
          history.pushState(null, "", newPath);
          handleRoute(newPath);
        });

        albumContainer.appendChild(albumCard);
      });
    } catch (error) {
      console.error("Error displaying albums:", error);
      albumContainer.innerHTML = "<p>Failed to load albums.</p>";
    }
  } else {
    // Show Album Images
    try {
      const albums = await getAlbums();
      const matchedAlbum = albums.find(a => a.albumName === albumNameFromPath);

      if (!matchedAlbum) {
        console.warn(`Album "${albumNameFromPath}" not found. Redirecting to home.`);
        history.replaceState(null, "", "/");
        handleRoute("/");
        return;
      }

      albumContainer.hidden = true;
      homeButton.hidden = false;
      imagesContainer.hidden = false;
      imagesContainer.innerHTML = '<div class="loader-sentinel"><div class="spinner"></div></div>';

      const response = await getOneAlbum(matchedAlbum.albumId);
      imagesContainer.innerHTML = ""; // Clear loader

      renderImages(response.images);

      currentNextPageToken = response.nextPageToken;

      if (currentNextPageToken) {
        const sentinel = document.createElement("div");
        sentinel.id = "scroll-sentinel";
        sentinel.className = "loader-sentinel";

        const spinner = document.createElement("div");
        spinner.className = "spinner";
        sentinel.appendChild(spinner);

        imagesContainer.appendChild(sentinel);

        intersectionObserver = new IntersectionObserver(async (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && currentNextPageToken && !isLoadingMore) {
            isLoadingMore = true;
            try {
              const nextResponse = await getOneAlbum(matchedAlbum.albumId, currentNextPageToken);

              renderImages(nextResponse.images, sentinel);

              currentNextPageToken = nextResponse.nextPageToken;

              if (!currentNextPageToken) {
                sentinel.remove();
                intersectionObserver?.disconnect();
                intersectionObserver = null;
              }
            } catch (error) {
              console.error("Error loading more images:", error);
            } finally {
              isLoadingMore = false;
            }
          }
        }, {
          rootMargin: "200px"
        });

        intersectionObserver.observe(sentinel);
      }
    } catch (error) {
      console.error(`Error loading album "${albumNameFromPath}":`, error);
      // Fallback on failure
      history.replaceState(null, "", "/");
      handleRoute("/");
    }
  }
};

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
  cachedAlbums = null;
  history.replaceState(null, "", "/");
  handleRoute("/");
});

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

