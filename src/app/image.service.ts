import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { PlannerImage } from './image';
import { AuthenticationService } from './authentication.service';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private rootUrl = environment.plannerBackendRootUrl;
  private apiContext = environment.plannerBackendImageContext;

  constructor(private http: HttpClient, private auth: AuthenticationService, private errors: ErrorService) { }

  uploadImages(images: FormData): Observable<PlannerImage[]> {
    return this.http.post<FormData>(this.rootUrl + this.apiContext + `?_csrf=${this.auth.csrfCookie}`, images, {
      headers: new HttpHeaders({
        'X-Auth-Token': this.auth.authToken,
        'X-Xsrf-Token': this.auth.csrfCookie
      }),
      withCredentials: true
    })
      .pipe(
        catchError(this.errors.handleError('uploadImages', null))
      );
  }

  getAllImages(): Observable<PlannerImage[]> {
    return this.http.get<PlannerImage[]>(this.rootUrl + this.apiContext, {
      headers: new HttpHeaders({
        'X-Auth-Token': this.auth.authToken,
        'X-Xsrf-Token': this.auth.csrfCookie
      }),
      withCredentials: true
    })
      .pipe(
        catchError(this.errors.handleError('getAllImages', null))
      );
  }
}
