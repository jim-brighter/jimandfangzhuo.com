import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ErrorService } from './error.service';
import { Observable, catchError } from 'rxjs';
import { ChristmasItem } from '../types/christmas';

@Injectable({
  providedIn: 'root'
})
export class ChristmasService {

  private rootUrl = environment.plannerBackendRootUrl;
  private apiContext = environment.plannerBackendChristmasContext;

  constructor(private http: HttpClient, private errors: ErrorService) { }

  getItems(): Observable<ChristmasItem[]> {
    return this.http.get<ChristmasItem[]>(this.rootUrl + this.apiContext, {})
    .pipe(
      catchError(this.errors.handleError('getItems', new Array<ChristmasItem>()))
    );
  }

  createItem(item: ChristmasItem): Observable<ChristmasItem> {
    return this.http.post<ChristmasItem>(this.rootUrl + this.apiContext, item, {})
    .pipe(
      catchError(this.errors.handleError('createItem', new ChristmasItem()))
    )
  }
}
