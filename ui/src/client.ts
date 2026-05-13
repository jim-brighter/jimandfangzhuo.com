import type { Album } from "./album";
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

export const getOneAlbum = async (albumId: string): Promise<string[]> => {
  const token = getIdToken();

  const response = await fetch(`https://api.jimandfangzhuo.com/api/images/${albumId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get album ${albumId}`);
  }

  const payload = await response.json();

  return payload as string[];
}
