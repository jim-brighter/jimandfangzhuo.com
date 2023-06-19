import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from './error.service';
import { Auth } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  idToken: string = '';

  constructor(private http: HttpClient,
              private errors: ErrorService) {

  }

  async authenticated(): Promise<boolean> {
    try {
      let user = await Auth.currentAuthenticatedUser();
      this.idToken = user.signInUserSession.idToken.jwtToken;
      return true;
    } catch(e) {
      return false;
    }
  }

  async authenticate(credentials: {username: string, password: string}, callback: () => void) {
    try {
      const result = await Auth.signIn(credentials.username, credentials.password);
      this.idToken = result.signInUserSession.idToken.jwtToken;
      return callback && callback();
    } catch(e) {
      console.error(e);
    }
  }

  async logout() {
    try {
      await Auth.signOut({
        global: true
      });
      this.wipeSession();
    } catch(e) {
      console.error(e);
    }
  }

  private handleError<T> (operation = 'operation', result ?: T) {
    this.wipeSession();
    return this.errors.handleError(operation, result);
  }

  private wipeSession() {
    this.idToken = '';
    localStorage.clear();
  }

}
