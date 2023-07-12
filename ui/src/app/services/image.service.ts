import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { PlannerImage } from '../types/image';
import { AuthenticationService } from './authentication.service';
import { ErrorService } from './error.service';
import { ImageUploadRequest } from '../types/image-upload-request';
import { Base64EncodedImage } from '../types/Base64EncodedImage';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private rootUrl = environment.plannerBackendRootUrl;
  private apiContext = environment.plannerBackendImageContext;

  constructor(private http: HttpClient, private auth: AuthenticationService, private errors: ErrorService) { }

  uploadImages(images: ImageUploadRequest): Observable<any> {
    return this.http.post<any>(this.rootUrl + this.apiContext, images, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('uploadImages', ''))
      );
  }

  getImage(imageId: string): Observable<Base64EncodedImage> {
    return this.http.get<Base64EncodedImage>(this.rootUrl + this.apiContext + `?imageId=${imageId}`, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
    .pipe(
      catchError(this.errors.handleError('getImage', new Base64EncodedImage()))
    )
  }

  getAllImages(): Observable<PlannerImage[]> {
    return this.http.get<PlannerImage[]>(this.rootUrl + this.apiContext, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('getAllImages', []))
      );
  }
}
