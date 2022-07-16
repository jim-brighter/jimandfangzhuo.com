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
  accessToken: string;

  // authToken: string;
  // csrfCookie: string;
  // tokenExpiration: string;

  constructor(private http: HttpClient,
              private errors: ErrorService) {
    const tokenAuth = localStorage.getItem(TOKEN_KEY);
    const tokenCsrf = localStorage.getItem(CSRF_KEY);
    const tokenExpiration = localStorage.getItem(TOKEN_EXPIRATION) || '';
    if (tokenAuth && tokenCsrf && (new Date().getTime() < parseInt(tokenExpiration))) {
      this.authenticated = true;
      // this.authToken = tokenAuth;
      // this.csrfCookie = tokenCsrf;
      // this.tokenExpiration = tokenExpiration;
    } else {
      this.wipeSession();
    }
  }

  // private getCsrfCookie(): string {
  //   const tab = document.cookie.split(';');
  //   if (tab.length > 0) {
  //     const tab1 = tab[0].split('=');
  //     if (tab1.length > 1) {
  //       return tab1[1];
  //     }
  //   }
  // }

  async authenticate(credentials, callback) {
    try {
      const result = await Auth.signIn(credentials.username, credentials.password);
      this.accessToken = result.storage['CognitoIdentityServiceProvider.1d7iiv4lebj54bhq29lf6fopru.fangzhuoxi.accessToken'];
      this.authenticated = true;
      return callback && callback();
    } catch(e) {
      console.error(e);
    }

    // const headers = new HttpHeaders(credentials ? {
    //   authorization: 'Basic ' + btoa(credentials.username + ':' + credentials.password)
    // } : {});

    // this.authenticated = true;

    // this.http.get(this.rootAuthUrl + '/token', { headers: headers, withCredentials: true })
    //   .pipe(
    //     catchError(this.handleError('authenticate', null))
    //   )
    //   .subscribe(response => {
    //     if (response && response['token']) {
    //       this.authenticated = true;

    //       this.authToken = response['token'];
    //       localStorage.setItem(TOKEN_KEY, this.authToken);

    //       this.csrfCookie = this.getCsrfCookie();
    //       localStorage.setItem(CSRF_KEY, this.csrfCookie);

    //       this.tokenExpiration = response['token_expiration'];
    //       localStorage.setItem(TOKEN_EXPIRATION, this.tokenExpiration);

    //       this.errors.clear();
    //     } else {
    //       this.wipeSession();
    //     }
    //
    //   });
  }

  logout() {
    return;
    // this.http.post(this.rootAuthUrl + `/logout?_csrf=${this.csrfCookie}`, {}, {
    //   responseType: 'text',
    //   headers: new HttpHeaders({
    //     'X-Auth-Token': this.authToken,
    //     'X-Xsrf-Token': this.csrfCookie
    //   }),
    //   withCredentials: true
    // })
    // .pipe(
    //   catchError(this.handleError('logout', null))
    // )
    // .subscribe(response => {
    //   this.wipeSession();
    // });
  }

  private handleError<T> (operation = 'operation', result ?: T) {
    this.wipeSession();
    return this.errors.handleError(operation, result);
  }

  private wipeSession() {
    this.authenticated = false;
    this.accessToken = null;
    // this.authToken = null;
    // this.csrfCookie = null;
    // this.tokenExpiration = null;
    localStorage.clear();
  }

}
