import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { PlannerImage } from '../types/image';
import { AuthenticationService } from './authentication.service';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private rootUrl = environment.plannerBackendRootUrl;
  private apiContext = environment.plannerBackendImageContext;

  constructor(private http: HttpClient, private auth: AuthenticationService, private errors: ErrorService) { }

  uploadImages(images: FormData): Observable<any> {
    return this.http.post<any>(this.rootUrl + this.apiContext, images, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('uploadImages', ''))
      );
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
