import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PlannerError } from './planner-error';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  private errorMessages: Array<PlannerError> = new Array<PlannerError>();

  constructor() { }

  getErrors(): Array<PlannerError> {
    return this.errorMessages;
  }

  addError(errorCode: number, errorMessage: string): void {
    const error: PlannerError = new PlannerError();
    error.errorCode = errorCode;
    error.errorMessage = errorMessage;
    if (this.errorMessages.filter((e) => e.errorCode === error.errorCode).length === 0) {
      this.errorMessages.push(error);
    }
  }

  clear(): void {
    this.errorMessages = [];
  }

  handleError<T> (operation = 'operation', result ?: T) {
    return (error: any): Observable<T> => {
      let message = `${operation} failed! Show Jim this error!`;
      if (error.status === 403) {
        message = 'Your session is invalid. Please try logging in again.';
      }
      else if (error.status === 413) {
        message = 'The photo you selected is too large. Files must be less than 10MB in size.'
      }
      this.addError(error.status, message);
      return of(result as T);
    };
  }
}
