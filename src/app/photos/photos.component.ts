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
export class PhotosComponent implements OnInit, OnDestroy {

  navigationSubscription;

  isLoading = true;

  digitalOceanSpace = 'https://image-space-jbrighter92.nyc3.digitaloceanspaces.com/';
  selectedImage: PlannerImage;

  faSignOutAlt = faSignOutAlt;
  faRotate = faRotate;

  constructor(private imageService: ImageService,
    public errors: ErrorService,
    private authenticator: AuthenticationService,
    private router: Router) {

      this.navigationSubscription = this.router.events.subscribe((e: any) => {
        if (e instanceof NavigationEnd) {
          this.getImages();
        }
      });
    }

  images: PlannerImage[];

  ngOnInit() {
    if (this.authenticated()) {
      this.getImages();
    }
  }

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
