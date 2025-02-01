import { Component, OnDestroy } from '@angular/core'
import { PlannerImage } from '../../types/image'
import { ImageService } from '../../services/image.service'
import { ErrorService } from '../../services/error.service'
import { AuthenticationService } from '../../services/authentication.service'
import { Router, NavigationEnd } from '@angular/router'
import { faSignOutAlt, faRotate } from '@fortawesome/free-solid-svg-icons'
import { NavbarComponent } from '../navbar/navbar.component'
import { NgIf, NgFor } from '@angular/common'
import { UploadComponent } from '../upload/upload.component'
import { LoginComponent } from '../login/login.component'

@Component({
    selector: 'app-photos',
    templateUrl: './photos.component.html',
    styleUrls: ['./photos.component.css'],
    imports: [NavbarComponent, NgIf, NgFor, UploadComponent, LoginComponent]
})
export class PhotosComponent implements OnDestroy {

  navigationSubscription

  isLoading = true
  isAuthenticated = false

  s3RootUrl = 'https://s3.amazonaws.com/jimandfangzhuo.com-images/'
  selectedImage: PlannerImage = new PlannerImage()

  faSignOutAlt = faSignOutAlt
  faRotate = faRotate

  constructor(private imageService: ImageService,
    public errors: ErrorService,
    private authenticator: AuthenticationService,
    private router: Router) {

    this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
      if (e instanceof NavigationEnd && await this.authenticated()) {
        this.getImages()
      }
    })
  }

  images: PlannerImage[] = []

  async authenticated(): Promise<boolean> {
    const authStatus = await this.authenticator.authenticated()
    this.isAuthenticated = authStatus
    return authStatus
  }

  getImages(): void {
    this.imageService.getAllImages().subscribe(data => {
      this.images = data
      this.isLoading = false
    })
  }

  zoomImage(image: PlannerImage): void {
    this.selectedImage = image
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe()
    }
  }

}
