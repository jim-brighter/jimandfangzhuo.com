import { checkAuthSession } from "./auth";
import { albumContainer, clearCachedAlbums, imagesContainer } from "./image-manager";
import { loginForm } from "./login";
import { cleanupPagination, mainContainer, showHome, showImages } from "./navigation";

export const handleRoute = async (path: string) => {
  cleanupPagination();
  const isLoggedIn = await checkAuthSession();

  if (!isLoggedIn) {
    loginForm.hidden = false;
    mainContainer.hidden = true;
    albumContainer.innerHTML = "";
    imagesContainer.innerHTML = "";
    clearCachedAlbums();
    return;
  }

  loginForm.hidden = true;
  mainContainer.hidden = false;

  // Clean trailing slash if present (except for root path)
  const cleanPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  // Decode the album name from pathname, removing leading slash
  const albumNameFromPath = decodeURIComponent(cleanPath.slice(1)).trim();

  if (!albumNameFromPath) {
    showHome();
  } else {
    showImages(albumNameFromPath);
  }
};
