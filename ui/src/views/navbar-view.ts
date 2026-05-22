export class NavbarView extends EventTarget {
  private homeBtn: HTMLButtonElement | null;
  private logoutBtn: HTMLButtonElement | null;

  constructor() {
    super();
    this.homeBtn = document.getElementById("home-btn") as HTMLButtonElement;
    this.logoutBtn = document.getElementById("logout") as HTMLButtonElement;

    this.homeBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      this.dispatchEvent(new CustomEvent("home-click"));
    });

    this.logoutBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      this.dispatchEvent(new CustomEvent("logout-click"));
    });
  }

  public setHomeButtonVisibility(visible: boolean) {
    if (this.homeBtn) {
      this.homeBtn.hidden = !visible;
    }
  }
}
