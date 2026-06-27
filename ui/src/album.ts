export type Album = {
  albumId: string;
  albumName: string;
  coverImageObjectKey: string;
  createdAt: number;
  presignedUrl: string;
};

export interface AlbumImage {
  originalUrl: string;
  thumbnailUrl: string;
  optimizedUrl?: string;
  videoUrl?: string;
}

export interface AlbumImagesResponse {
  images: AlbumImage[];
  nextPageToken?: string;
}

export function isVideo(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith(".mp4") || 
           pathname.endsWith(".mov") || 
           pathname.endsWith(".m4v") || 
           pathname.endsWith(".avi");
  } catch {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes(".mp4") || 
           lowerUrl.includes(".mov") || 
           lowerUrl.includes(".m4v") || 
           lowerUrl.includes(".avi");
  }
}

