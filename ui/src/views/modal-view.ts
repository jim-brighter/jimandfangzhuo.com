import { isVideo } from "../album";

export class ModalView extends EventTarget {
  private container: HTMLDivElement;
  private image: HTMLImageElement;
  private video: HTMLVideoElement;

  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private isSwiping = false;

  private activeElement: HTMLImageElement | HTMLVideoElement | null = null;
  private activeLoadListener: (() => void) | null = null;
  private activeErrorListener: (() => void) | null = null;

  constructor(containerId: string) {
    super();
    this.container = document.getElementById(containerId) as HTMLDivElement;
    this.image = document.getElementById("modal-image") as HTMLImageElement;
    this.video = document.getElementById("modal-video") as HTMLVideoElement;

    this.container.onclick = (e) => {
      // If the user clicks on the video controls, don't close the modal
      if (e.target === this.video) {
        return;
      }
      if (this.isSwiping) {
        this.isSwiping = false;
        return;
      }
      this.hide();
    };

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (this.container.hidden) return;

      if (e.key === "ArrowRight" || e.key === "Right") {
        this.dispatchEvent(new CustomEvent("navigate", { detail: { direction: "next" } }));
      } else if (e.key === "ArrowLeft" || e.key === "Left") {
        this.dispatchEvent(new CustomEvent("navigate", { detail: { direction: "prev" } }));
      } else if (e.key === "Escape" || e.key === "Esc") {
        this.hide();
      }
    });

    // Mobile swipe gestures
    this.container.addEventListener("touchstart", (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isSwiping = false;
    }, { passive: true });

    this.container.addEventListener("touchmove", (e) => {
      const moveX = e.touches[0].clientX;
      const moveY = e.touches[0].clientY;
      const diffX = moveX - this.touchStartX;
      const diffY = moveY - this.touchStartY;
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        this.isSwiping = true;
      }
    }, { passive: true });

    this.container.addEventListener("touchend", (e) => {
      this.touchEndX = e.changedTouches[0].clientX;
      this.touchEndY = e.changedTouches[0].clientY;
      if (this.isSwiping) {
        this.handleSwipe();
        // Keep isSwiping = true briefly to ignore click trigger on touch end
        setTimeout(() => {
          this.isSwiping = false;
        }, 100);
      }
    }, { passive: true });
  }

  private handleSwipe() {
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 50) { // 50px swipe threshold
        if (diffX > 0) {
          this.dispatchEvent(new CustomEvent("navigate", { detail: { direction: "prev" } }));
        } else {
          this.dispatchEvent(new CustomEvent("navigate", { detail: { direction: "next" } }));
        }
      }
    }
  }

  private cleanupPendingLoad() {
    if (this.activeElement && this.activeLoadListener) {
      const eventName = this.activeElement.tagName === "VIDEO" ? "canplay" : "load";
      this.activeElement.removeEventListener(eventName, this.activeLoadListener);
      this.activeLoadListener = null;
    }
    if (this.activeElement && this.activeErrorListener) {
      this.activeElement.removeEventListener("error", this.activeErrorListener);
      this.activeErrorListener = null;
    }
    this.activeElement = null;
  }

  private stopVideoPlayback() {
    this.video.pause();
    this.video.src = "";
    this.video.onended = null;
    this.video.hidden = true;
    this.video.classList.remove("fade-in");
  }

  private loadMedia(mediaSrc: string, mediaAlt: string) {
    this.cleanupPendingLoad();
    this.stopVideoPlayback();

    const isVid = isVideo(mediaSrc);

    if (isVid) {
      // Standalone Video: Autoplay with controls
      this.image.hidden = true;
      this.video.hidden = false;
      this.video.controls = true;
      this.video.loop = false;
      this.video.style.opacity = "0";
      this.video.classList.remove("fade-in");

      const onCanPlay = () => {
        this.cleanupPendingLoad();
        this.video.style.opacity = "";
        void this.video.offsetWidth; // Force reflow
        this.video.classList.add("fade-in");
        this.video.play().catch(e => console.error("Standalone video autoplay failed", e));
      };

      this.activeElement = this.video;
      this.activeLoadListener = onCanPlay;
      this.video.addEventListener("canplay", onCanPlay);
      this.video.src = mediaSrc;

    } else {
      // Image file
      this.image.hidden = false;
      this.image.classList.remove("fade-in");
      this.image.style.opacity = "0";

      const onLoad = () => {
        this.cleanupPendingLoad();
        this.image.style.opacity = "";
        void this.image.offsetWidth; // Force reflow
        this.image.classList.add("fade-in");
      };

      const onError = () => {
        this.cleanupPendingLoad();
        this.image.style.opacity = "";
      };

      this.activeElement = this.image;
      this.activeLoadListener = onLoad;
      this.activeErrorListener = onError;

      this.image.addEventListener("load", onLoad);
      this.image.addEventListener("error", onError);

      this.image.src = mediaSrc;
      this.image.alt = mediaAlt;
    }
  }

  public show(mediaSrc: string, mediaAlt: string) {
    this.container.hidden = false;
    document.body.classList.add("no-scroll-fixed");
    this.loadMedia(mediaSrc, mediaAlt);
  }

  public updateImage(mediaSrc: string, mediaAlt: string) {
    this.loadMedia(mediaSrc, mediaAlt);
  }

  public hide() {
    this.container.hidden = true;
    document.body.classList.remove("no-scroll-fixed");
    this.cleanup();
  }

  private cleanup() {
    this.cleanupPendingLoad();
    this.stopVideoPlayback();
    this.image.src = "";
    this.image.alt = "";
    this.image.classList.remove("fade-in");
    this.image.style.opacity = "";
    this.image.hidden = true;
    this.video.style.opacity = "";
    this.video.hidden = true;
  }
}
