import type { Album } from "../album";

export class AlbumListView extends EventTarget {
  private container: HTMLDivElement;

  constructor(containerId: string) {
    super();
    this.container = document.getElementById(containerId) as HTMLDivElement;
  }

  public show() {
    this.container.hidden = false;
  }

  public hide() {
    this.container.hidden = true;
    this.clear();
  }

  public clear() {
    this.container.innerHTML = "";
  }

  public showLoader() {
    this.clear();
    this.container.innerHTML = '<div class="loader-sentinel"><div class="spinner"></div></div>';
  }

  public render(albums: Album[]) {
    this.clear();

    albums.forEach((album) => {
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
        this.dispatchEvent(
          new CustomEvent("album-select", {
            detail: { albumName: album.albumName },
          })
        );
      });

      this.container.appendChild(albumCard);
    });
  }

  public renderError(message: string) {
    this.container.innerHTML = `<p>${message}</p>`;
  }
}
