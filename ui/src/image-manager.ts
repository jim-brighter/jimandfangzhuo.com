import type { Album, AlbumImage } from "./album";
import { getAllAlbums } from "./client";
import { getImageObserver } from "./navigation";
import { handleRoute } from "./router";

const PLACEHOLDER_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export let cachedAlbums: Album[] | null = null;
export const imagesContainer = document.getElementById("images-container") as HTMLDivElement;
export const albumContainer = document.getElementById("album-container") as HTMLDivElement;

export const clearCachedAlbums = () => {
  cachedAlbums = null;
}

export const renderImages = (images: AlbumImage[], beforeElement?: HTMLElement) => {
  const imageObserver = getImageObserver(PLACEHOLDER_GIF);

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

export const getAlbums = async (): Promise<Album[]> => {
  if (!cachedAlbums) {
    cachedAlbums = await getAllAlbums();
  }
  return cachedAlbums;
};

export const renderAlbums = async () => {
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
}
