import type { Album } from "./album";
import { getOneAlbum } from "./client";
import { albumContainer, getAlbums, imagesContainer, renderAlbums, renderImages } from "./image-manager";
import { handleRoute } from "./router";

export const homeButton = document.getElementById("home-btn") as HTMLButtonElement;
export const mainContainer = document.getElementById("main") as HTMLDivElement;

let currentNextPageToken: string | undefined = undefined;
let isLoadingMore = false;
let intersectionObserver: IntersectionObserver | null = null;
let imageObserver: IntersectionObserver | null = null;

export const getImageObserver = (placeholder: string) => {
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
          if (img.src && img.src !== placeholder) {
            img.src = placeholder;
          }
        }
      });
    }, {
      rootMargin: "800px" // Preemptively load images 800px before they enter viewport
    });
  }

  return imageObserver;
}

export const cleanupPagination = () => {
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

export const showHome = async () => {
  homeButton.hidden = true;
  albumContainer.hidden = false;
  imagesContainer.hidden = true;
  imagesContainer.innerHTML = "";

  renderAlbums();
}

const setupInfiniteScrolling = (matchedAlbum: Album) => {
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

export const showImages = async (albumNameFromPath: string) => {
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
      setupInfiniteScrolling(matchedAlbum);
    }
  } catch (error) {
    console.error(`Error loading album "${albumNameFromPath}":`, error);
    // Fallback on failure
    history.replaceState(null, "", "/");
    handleRoute("/");
  }
}
