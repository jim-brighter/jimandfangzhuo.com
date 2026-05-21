import type { Album, AlbumImage, AlbumImagesResponse } from "./album";
import { getIdToken } from "./auth";

export const getAllAlbums = async (): Promise<Album[]> => {
  const token = getIdToken();

  const response = await fetch("https://api.jimandfangzhuo.com/api/images", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get all albums: ${response.statusText}`);
  }

  const payload = await response.json();

  return payload.items as Album[];
}

export const getOneAlbum = async (albumId: string, nextPageToken?: string): Promise<AlbumImagesResponse> => {
  const token = getIdToken();

  const url = new URL(`https://api.jimandfangzhuo.com/api/images/${albumId}`);
  if (nextPageToken) {
    url.searchParams.append("nextPageToken", nextPageToken);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get album ${albumId}`);
  }

  const payload = await response.json();

  return {
    images: payload.images as AlbumImage[],
    nextPageToken: payload.nextPageToken as string | undefined
  };
}
