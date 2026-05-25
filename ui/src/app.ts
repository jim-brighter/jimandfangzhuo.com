import type { Album } from "./album";
import { checkAuthSession, doLogin, doLogout, initAuth } from "./auth";
import { getAllAlbums, getOneAlbum } from "./client";
import { AlbumListView } from "./views/album-list-view";
import { ImageGridView } from "./views/image-grid-view";
import { LoginView } from "./views/login-view";
import { ModalView } from "./views/modal-view";
import { NavbarView } from "./views/navbar-view";

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

  constructor() {
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
      this.modalView.show(imageUrl, imageAlt);
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
      this.loginView.showError(
        error instanceof Error ? error.message : "Login failed. Please check credentials."
      );
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
      const albums = await this.getAlbums();
      this.albumListView.render(albums);
    } catch (error) {
      console.error("Error displaying albums:", error);
      this.albumListView.renderError("Failed to load albums.");
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
}
