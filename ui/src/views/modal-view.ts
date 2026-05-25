export class ModalView extends EventTarget {
  private container: HTMLDivElement;
  private contents: HTMLDivElement;
  private image: HTMLImageElement;

  constructor(containerId: string) {
    super();
    this.container = document.getElementById(containerId) as HTMLDivElement;
    this.contents = this.container.firstElementChild as HTMLDivElement;
    this.image = this.contents.firstElementChild as HTMLImageElement;

    this.container.onclick = () => {
      this.hide();
    }
  }

  public show(imageSrc: string, imageAlt: string) {
    this.image.src = imageSrc;
    this.image.alt = imageAlt;
    this.container.hidden = false;

    document.body.classList.add("no-scroll-fixed");
  }

  public hide() {
    this.container.hidden = true;
    document.body.classList.remove("no-scroll-fixed");
    this.cleanup();
  }

  private cleanup() {
    this.image.src = "";
    this.image.alt = "";
  }
}
