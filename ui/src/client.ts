import { getIdToken } from "./auth";

export const getAllAlbums = async () => {
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

  console.log(payload);

  return payload;
}
