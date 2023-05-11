import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { PlannerEvent } from './event';
import { AuthenticationService } from './authentication.service';
import { ErrorService } from './error.service';
import { SuccessResponse } from './success-response';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private rootUrl = environment.plannerBackendRootUrl;
  private apiContext = environment.plannerBackendEventsContext;

  constructor(private http: HttpClient,
    private auth: AuthenticationService,
    private errors: ErrorService) { }

  getEvents(): Observable<PlannerEvent[]> {
    return this.http.get<PlannerEvent[]>(`${this.rootUrl + this.apiContext}`, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('getEvents', new Array<PlannerEvent>()))
      );
  }

  getEventsByType(type: string): Observable<PlannerEvent[]> {
    return this.http.get<PlannerEvent[]>(`${this.rootUrl + this.apiContext}/${type}`, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('getEventsByType', new Array<PlannerEvent>()))
      );
  }

  saveEvent(event: PlannerEvent): Observable<PlannerEvent> {
    event.description = event.description || '';
    return this.http.post<PlannerEvent>(`${this.rootUrl + this.apiContext}`, event, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('saveEvent', new PlannerEvent()))
      );
  }

  deleteEvent(eventIds: string[]): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`${this.rootUrl + this.apiContext}`, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      },
      body: eventIds
    })
    .pipe(
      catchError(this.errors.handleError('deleteEvent', new SuccessResponse()))
    );
  }

  updateEvents(events: PlannerEvent[]): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(`${this.rootUrl + this.apiContext}`, events, {
      headers: {
        Authorization: `Bearer ${this.auth.idToken}`
      }
    })
      .pipe(
        catchError(this.errors.handleError('updateEvents', new SuccessResponse()))
      );
  }

}
