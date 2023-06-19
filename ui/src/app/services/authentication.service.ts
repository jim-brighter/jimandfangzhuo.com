import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from './error.service';
import { Auth } from 'aws-amplify';

const TOKEN_KEY = 'authToken';
const CSRF_KEY = 'csrfToken';
const TOKEN_EXPIRATION = 'tokenExpiration';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  authenticated = false;
  idToken: string = '';

  constructor(private http: HttpClient,
              private errors: ErrorService) {
    const tokenAuth = localStorage.getItem(TOKEN_KEY);
    const tokenCsrf = localStorage.getItem(CSRF_KEY);
    const tokenExpiration = localStorage.getItem(TOKEN_EXPIRATION) || '';
    if (tokenAuth && tokenCsrf && (new Date().getTime() < parseInt(tokenExpiration))) {
      this.authenticated = true;
    } else {
      this.wipeSession();
    }
  }

  async authenticate(credentials: {username: string, password: string}, callback: () => void) {
    try {
      const result = await Auth.signIn(credentials.username, credentials.password);
      this.idToken = result.signInUserSession.idToken.jwtToken;
      this.authenticated = true;
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
    this.authenticated = false;
    this.idToken = '';
    localStorage.clear();
  }

}
