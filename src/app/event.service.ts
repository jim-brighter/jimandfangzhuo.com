import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { PlannerEvent } from './event';
import { AuthenticationService } from './authentication.service';
import { ErrorService } from './error.service';

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
    return this.http.get<PlannerEvent[]>(`${this.rootUrl + this.apiContext}`, {})
      .pipe(
        catchError(this.errors.handleError('getEvents', new Array<PlannerEvent>()))
      );
  }

  getEventsByType(type): Observable<PlannerEvent[]> {
    return this.http.get<PlannerEvent[]>(`${this.rootUrl + this.apiContext}/${type}`, {})
      .pipe(
        catchError(this.errors.handleError('getEventsByType', new Array<PlannerEvent>()))
      );
  }

  saveEvent(event: PlannerEvent): Observable<PlannerEvent> {
    event.description = event.description || '';
    return this.http.post<PlannerEvent>(`${this.rootUrl + this.apiContext}`, event, {})
      .pipe(
        catchError(this.errors.handleError('saveEvent', new PlannerEvent()))
      );
  }

  deleteEvent(events: PlannerEvent[]): Observable<PlannerEvent> {
    return this.http.delete<PlannerEvent[]>(`${this.rootUrl + this.apiContext}`, {
      body: events
    })
      .pipe(
        catchError(this.errors.handleError('deleteEvent', null))
      );
  }

  updateEvents(events: PlannerEvent[]): Observable<PlannerEvent[]> {
    return this.http.put<PlannerEvent[]>(`${this.rootUrl + this.apiContext}`, events, {})
      .pipe(
        catchError(this.errors.handleError('updateEvents', new Array<PlannerEvent>()))
      );
  }

}
