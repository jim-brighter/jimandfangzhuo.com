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
  videoUrl?: string;
}

export interface AlbumImagesResponse {
  images: AlbumImage[];
  nextPageToken?: string;
}
