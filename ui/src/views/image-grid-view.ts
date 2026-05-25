import type { AlbumImage } from "../album";

const PLACEHOLDER_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export class ImageGridView extends EventTarget {
  private container: HTMLDivElement;
  private imageObserver: IntersectionObserver | null = null;
  private infiniteScrollObserver: IntersectionObserver | null = null;
  private currentSentinel: HTMLDivElement | null = null;
  private isLoadingMore = false;

  constructor(containerId: string) {
    super();
    this.container = document.getElementById(containerId) as HTMLDivElement;
  }

  public show() {
    this.container.hidden = false;
  }

  public hide() {
    this.container.hidden = true;
    this.cleanup();
  }

  public cleanup() {
    this.cleanupImageObserver();
    this.cleanupInfiniteScroll();
    this.container.innerHTML = "";
    this.isLoadingMore = false;
  }

  private emitModalSelection(img: HTMLImageElement) {
    this.dispatchEvent(new CustomEvent("modal-select",
      {
        detail: {
          imageUrl: img.dataset.original,
          imageAlt: img.alt
        }
      }
    ));
  }

  private getImageObserver() {
    if (!this.imageObserver) {
      this.imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
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
        },
        {
          rootMargin: "800px", // Preemptively load images 800px before they enter viewport
        }
      );
    }
    return this.imageObserver;
  }

  private cleanupImageObserver() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }
  }

  public renderInitialImages(images: AlbumImage[]) {
    this.cleanup();
    this.appendImages(images);
  }

  public appendImages(images: AlbumImage[], beforeElement?: HTMLElement) {
    const observer = this.getImageObserver();

    images.forEach((image) => {
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

      imageImg.onclick = () => {
        this.emitModalSelection(imageImg);
      }

      if (beforeElement) {
        this.container.insertBefore(imageImg, beforeElement);
      } else {
        this.container.appendChild(imageImg);
      }

      observer.observe(imageImg);
    });
  }

  public showInitialLoader() {
    this.cleanup();
    this.container.innerHTML = '<div class="loader-sentinel"><div class="spinner"></div></div>';
  }

  public setupInfiniteScrolling(hasMore: boolean) {
    this.cleanupInfiniteScroll();
    if (!hasMore) return;

    const sentinel = document.createElement("div");
    sentinel.id = "scroll-sentinel";
    sentinel.className = "loader-sentinel";

    const spinner = document.createElement("div");
    spinner.className = "spinner";
    sentinel.appendChild(spinner);

    this.container.appendChild(sentinel);
    this.currentSentinel = sentinel;

    this.infiniteScrollObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.isLoadingMore) {
          this.isLoadingMore = true;
          this.dispatchEvent(new CustomEvent("load-more"));
        }
      },
      {
        rootMargin: "200px",
      }
    );

    this.infiniteScrollObserver.observe(sentinel);
  }

  public setLoadingMore(loading: boolean) {
    this.isLoadingMore = loading;
    if (!loading) {
      this.checkSentinelVisibility();
    }
  }

  private checkSentinelVisibility() {
    setTimeout(() => {
      if (!this.currentSentinel?.isConnected) return;
      const rect = this.currentSentinel.getBoundingClientRect();
      const isStillVisible = rect.top < window.innerHeight + 200; // matching the 200px rootMargin
      if (isStillVisible && !this.isLoadingMore) {
        this.isLoadingMore = true;
        this.dispatchEvent(new CustomEvent("load-more"));
      }
    }, 0);
  }

  public removeSentinel() {
    this.cleanupInfiniteScroll();
  }

  private cleanupInfiniteScroll() {
    if (this.infiniteScrollObserver) {
      this.infiniteScrollObserver.disconnect();
      this.infiniteScrollObserver = null;
    }
    if (this.currentSentinel) {
      this.currentSentinel.remove();
      this.currentSentinel = null;
    }
    this.isLoadingMore = false;
  }
}
