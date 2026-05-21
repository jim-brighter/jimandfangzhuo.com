export class LoginView extends EventTarget {
  private form: HTMLFormElement;
  private errorMsg: HTMLDivElement | null;
  private submitBtn: HTMLButtonElement | null;
  private btnText: HTMLSpanElement | null;
  private btnLoader: HTMLDivElement | null;
  private usernameInput: HTMLInputElement | null;
  private passwordInput: HTMLInputElement | null;

  constructor(formId: string) {
    super();
    this.form = document.getElementById(formId) as HTMLFormElement;
    this.errorMsg = document.getElementById("login-error") as HTMLDivElement;
    this.submitBtn = document.getElementById("login-btn") as HTMLButtonElement;
    this.btnText = this.submitBtn?.querySelector(".btn-text") as HTMLSpanElement;
    this.btnLoader = this.submitBtn?.querySelector(".btn-loader") as HTMLDivElement;
    this.usernameInput = document.getElementById("username") as HTMLInputElement;
    this.passwordInput = document.getElementById("password") as HTMLInputElement;

    this.initEvents();
  }

  private initEvents() {
    const clearError = () => this.hideError();
    this.usernameInput?.addEventListener("input", clearError);
    this.passwordInput?.addEventListener("input", clearError);

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(this.form);
      const username = data.get("username") as string;
      const password = data.get("password") as string;

      this.hideError();
      this.setLoading(true);

      this.dispatchEvent(
        new CustomEvent("login-attempt", {
          detail: { username, password },
        })
      );
    });
  }

  public show() {
    this.form.hidden = false;
  }

  public hide() {
    this.form.hidden = true;
    this.hideError();
    this.form.reset();
  }

  public showError(msg: string) {
    if (this.errorMsg) {
      this.errorMsg.hidden = false;
      this.errorMsg.textContent = msg;
    } else {
      alert(msg);
    }
  }

  public hideError() {
    if (this.errorMsg) {
      this.errorMsg.hidden = true;
      this.errorMsg.textContent = "";
    }
  }

  public setLoading(loading: boolean) {
    if (this.submitBtn) this.submitBtn.disabled = loading;
    if (this.btnText) this.btnText.style.opacity = loading ? "0" : "1";
    if (this.btnLoader) this.btnLoader.hidden = !loading;
  }
}
