import type { Album, AlbumImage } from "./album";
import { checkAuthSession, doLogin, doLogout, initAuth } from "./auth";
import { getAllAlbums, getOneAlbum } from "./client";
import { AlbumListView } from "./views/album-list-view";
import { ImageGridView } from "./views/image-grid-view";
import { LoginView } from "./views/login-view";
import { ModalView } from "./views/modal-view";
import { NavbarView } from "./views/navbar-view";
import { t, translateError, translateStaticDOM } from "./i18n";

export class App {
  private loginView: LoginView;
  private navbarView: NavbarView;
  private albumListView: AlbumListView;
  private imageGridView: ImageGridView;
  private modalView: ModalView;
  private mainContainer: HTMLDivElement;

  private cachedAlbums: Album[] | null = null;
  private currentNextPageToken: string | undefined = undefined;
  private currentAlbum: Album | null = null;
  private loadedImages: AlbumImage[] = [];
  private currentImageIndex: number = -1;

  constructor() {
    translateStaticDOM();
    this.mainContainer = document.getElementById("main") as HTMLDivElement;

    this.loginView = new LoginView("login");
    this.navbarView = new NavbarView();
    this.albumListView = new AlbumListView("album-container");
    this.imageGridView = new ImageGridView("images-container");
    this.modalView = new ModalView("modal");

    this.initViewEvents();
  }

  private initViewEvents() {
    this.loginView.addEventListener("login-attempt", (event: Event) => {
      const customEvent = event as CustomEvent;
      const { username, password } = customEvent.detail;
      this.handleLogin(username, password);
    });

    this.navbarView.addEventListener("home-click", () => {
      this.navigateToHome();
    });

    this.navbarView.addEventListener("logout-click", () => {
      this.handleLogout();
    });

    this.albumListView.addEventListener("album-select", (event: Event) => {
      const customEvent = event as CustomEvent;
      const { albumName } = customEvent.detail;
      this.navigateToAlbum(albumName);
    });

    this.imageGridView.addEventListener("load-more", async () => {
      try {
        await this.loadMoreImages();
      } finally {
        this.imageGridView.setLoadingMore(false);
      }
    });

    this.imageGridView.addEventListener("modal-select", (event: Event) => {
      const customEvent = event as CustomEvent;
      const { imageUrl, imageAlt } = customEvent.detail;
      this.currentImageIndex = this.loadedImages.findIndex((img) => img.originalUrl === imageUrl);
      this.modalView.show(imageUrl, imageAlt);
    });

    this.modalView.addEventListener("navigate", async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { direction } = customEvent.detail;
      await this.navigateModal(direction);
    });
  }

  public async init() {
    // Start auth flow
    initAuth();

    // Listen to navigation events (Back/Forward)
    window.addEventListener("popstate", () => {
      this.handleRoute(window.location.pathname);
    });

    // Initialize Route
    await this.handleRoute(window.location.pathname);
  }

  private async handleLogin(username: string, password: string) {
    try {
      await doLogin(username, password);
      this.loginView.setLoading(false);
      this.triggerRouteUpdate();
    } catch (error) {
      this.loginView.setLoading(false);
      this.loginView.showError(translateError(error));
    }
  }

  private async handleLogout() {
    await doLogout();
    this.cachedAlbums = null;
    history.replaceState(null, "", "/");
    this.triggerRouteUpdate();
  }

  private navigateToHome() {
    history.pushState(null, "", "/");
    this.triggerRouteUpdate();
  }

  private navigateToAlbum(albumName: string) {
    const newPath = `/${encodeURIComponent(albumName)}`;
    history.pushState(null, "", newPath);
    this.triggerRouteUpdate();
  }

  private triggerRouteUpdate() {
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  private async getAlbums(): Promise<Album[]> {
    if (!this.cachedAlbums) {
      this.cachedAlbums = await getAllAlbums();
    }
    return this.cachedAlbums;
  }

  public async handleRoute(path: string) {
    // 1. Cleanup active view state/subscriptions
    this.imageGridView.cleanup();
    this.albumListView.clear();
    this.currentNextPageToken = undefined;
    this.currentAlbum = null;
    this.loadedImages = [];
    this.currentImageIndex = -1;

    // 2. Check auth status
    const isLoggedIn = await checkAuthSession();
    if (!isLoggedIn) {
      this.loginView.show();
      this.mainContainer.hidden = true;
      this.cachedAlbums = null;
      return;
    }

    this.loginView.hide();
    this.mainContainer.hidden = false;

    // Clean trailing slash if present (except for root path)
    const cleanPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
    // Decode the album name from pathname, removing leading slash
    const albumNameFromPath = decodeURIComponent(cleanPath.slice(1)).trim();

    if (!albumNameFromPath) {
      await this.showHome();
    } else {
      try {
        await this.showImages(albumNameFromPath);
      } catch (error) {
        console.warn(`Redirecting to home due to routing error:`, error);
        history.replaceState(null, "", "/");
        await this.showHome();
      }
    }
  }

  private async showHome() {
    this.navbarView.setHomeButtonVisibility(false);
    this.albumListView.show();
    this.imageGridView.hide();

    try {
      if (!this.cachedAlbums) {
        this.albumListView.showLoader();
      }
      const albums = await this.getAlbums();
      this.albumListView.render(albums);
    } catch (error) {
      console.error("Error displaying albums:", error);
      this.albumListView.renderError(t("failedToLoadAlbums"));
    }
  }

  private async showImages(albumName: string) {
    const albums = await this.getAlbums();
    const matchedAlbum = albums.find((a) => a.albumName === albumName);

    if (!matchedAlbum) {
      throw new Error(`Album "${albumName}" not found.`);
    }

    this.currentAlbum = matchedAlbum;
    this.navbarView.setHomeButtonVisibility(true);
    this.albumListView.hide();
    this.imageGridView.show();
    this.imageGridView.showInitialLoader();

    try {
      const response = await getOneAlbum(matchedAlbum.albumId);
      this.loadedImages = response.images;
      this.imageGridView.renderInitialImages(response.images);
      this.currentNextPageToken = response.nextPageToken;

      this.imageGridView.setupInfiniteScrolling(!!this.currentNextPageToken);
    } catch (error) {
      console.error(`Error loading album "${albumName}":`, error);
      throw error;
    }
  }

  private async loadMoreImages() {
    if (!this.currentAlbum || !this.currentNextPageToken) return;

    const response = await getOneAlbum(this.currentAlbum.albumId, this.currentNextPageToken);

    this.loadedImages.push(...response.images);

    // Append images before the sentinel element if it exists in the DOM
    const sentinel = document.getElementById("scroll-sentinel");
    if (sentinel) {
      this.imageGridView.appendImages(response.images, sentinel);
    } else {
      this.imageGridView.appendImages(response.images);
    }

    this.currentNextPageToken = response.nextPageToken;

    if (!this.currentNextPageToken) {
      this.imageGridView.removeSentinel();
    }
  }

  private async navigateModal(direction: "next" | "prev") {
    if (this.currentImageIndex === -1 || this.loadedImages.length === 0) return;

    if (direction === "next") {
      if (this.currentImageIndex < this.loadedImages.length - 1) {
        this.currentImageIndex++;
        const nextImg = this.loadedImages[this.currentImageIndex];
        this.modalView.updateImage(nextImg.originalUrl, t("albumPhoto"));
      } else {
        // We are on the last image. Can we load more?
        if (this.currentNextPageToken) {
          try {
            await this.loadMoreImages();
            // After loading more, if we got more images, navigate to the next one
            if (this.currentImageIndex < this.loadedImages.length - 1) {
              this.currentImageIndex++;
              const nextImg = this.loadedImages[this.currentImageIndex];
              this.modalView.updateImage(nextImg.originalUrl, t("albumPhoto"));
            }
          } catch (e) {
            console.error("Failed to load more images for modal navigation:", e);
          }
        } else {
          // Wrap around to start
          this.currentImageIndex = 0;
          const nextImg = this.loadedImages[this.currentImageIndex];
          this.modalView.updateImage(nextImg.originalUrl, t("albumPhoto"));
        }
      }
    } else {
      // direction === "prev"
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
        const prevImg = this.loadedImages[this.currentImageIndex];
        this.modalView.updateImage(prevImg.originalUrl, t("albumPhoto"));
      } else {
        // Wrap around to the end of currently loaded images
        this.currentImageIndex = this.loadedImages.length - 1;
        const prevImg = this.loadedImages[this.currentImageIndex];
        this.modalView.updateImage(prevImg.originalUrl, t("albumPhoto"));
      }
    }
  }
}
