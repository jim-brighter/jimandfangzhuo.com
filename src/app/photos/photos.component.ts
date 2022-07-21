import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlannerImage } from '../image';
import { ImageService } from '../image.service';
import { ErrorService } from '../error.service';
import { AuthenticationService } from '../authentication.service';
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

  s3RootUrl = 'https://s3.amazonaws.com/jimandfangzhuo.com-images/';
  selectedImage: PlannerImage;

  faSignOutAlt = faSignOutAlt;
  faRotate = faRotate;

  constructor(private imageService: ImageService,
    public errors: ErrorService,
    private authenticator: AuthenticationService,
    private router: Router) {

      this.navigationSubscription = this.router.events.subscribe((e: any) => {
        if (e instanceof NavigationEnd && this.authenticated()) {
          this.getImages();
        }
      });
    }

  images: PlannerImage[];

  authenticated(): boolean {
    return this.authenticator.authenticated;
  }

  getImages(): void {
    this.imageService.getAllImages().subscribe(data => {
      this.images = data;
      this.isLoading = false;
    });
  }

  zoomImage(image: PlannerImage): void {
    this.selectedImage = image;
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

}
