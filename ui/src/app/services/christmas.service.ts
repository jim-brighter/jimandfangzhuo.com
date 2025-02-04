import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment'
import { ErrorService } from './error.service'
import { catchError, Observable } from 'rxjs'
import { ChristmasItem } from '../types/christmas'
import { AuthenticationService } from './authentication.service'
import { SuccessResponse } from '../types/success-response'

@Injectable({
  providedIn: 'root'
})
export class ChristmasService {

  private rootUrl = environment.plannerBackendRootUrl
  private apiContext = environment.plannerBackendChristmasContext

  constructor(private http: HttpClient, private errors: ErrorService, private auth: AuthenticationService) {
  }

  getItems(): Observable<ChristmasItem[]> {
    return this.http.get<ChristmasItem[]>(this.rootUrl + this.apiContext, {})
      .pipe(
        catchError(this.errors.handleError('getItems', new Array<ChristmasItem>()))
      )
  }

  createItem(item: ChristmasItem): Observable<ChristmasItem> {
    return this.http.post<ChristmasItem>(this.rootUrl + this.apiContext, item, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('createItem', new ChristmasItem()))
      )
  }

  updateItem(item: ChristmasItem): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(this.rootUrl + this.apiContext, item, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('updateItem', new SuccessResponse()))
      )
  }

  deleteItem(items: string[]): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(this.rootUrl + this.apiContext, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      },
      body: items
    })
      .pipe(
        catchError(this.errors.handleError('deleteItem', new SuccessResponse()))
      )
  }
}
