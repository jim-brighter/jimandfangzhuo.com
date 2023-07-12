import { Component, OnDestroy } from '@angular/core';
import { PlannerImage } from '../../types/image';
import { ImageService } from '../../services/image.service';
import { ErrorService } from '../../services/error.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Router, NavigationEnd } from '@angular/router';
import { faSignOutAlt, faRotate } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.css']
})
export class PhotosComponent implements OnDestroy {

  navigationSubscription;

  isLoading = true;
  isAuthenticated = false;

  s3RootUrl = 'https://s3.amazonaws.com/jimandfangzhuo.com-images/';
  selectedImage: string = '';

  faSignOutAlt = faSignOutAlt;
  faRotate = faRotate;

  constructor(private imageService: ImageService,
    public errors: ErrorService,
    private authenticator: AuthenticationService,
    private router: Router) {

    this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
      if (e instanceof NavigationEnd && await this.authenticated()) {
        this.getImages()
      }
    });
  }

  images: PlannerImage[] = [];
  base64Images: string[] = [];

  async authenticated(): Promise<boolean> {
    const authStatus = await this.authenticator.authenticated();
    this.isAuthenticated = authStatus;
    return authStatus;
  }

  getImages(): void {
    this.imageService.getAllImages().subscribe(data => {
      this.images = data;
      this.isLoading = false;

      this.images = this.images.reverse();

      this.images.forEach(image => {
        this.imageService.getImage(image.s3ObjectKey).subscribe(imageData => {
          this.base64Images.push(imageData.base64Image);
        });
      })
    });
  }

  zoomImage(image: string): void {
    this.selectedImage = image;
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

}
