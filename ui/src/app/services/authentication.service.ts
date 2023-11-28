import { Injectable } from '@angular/core';
import { ErrorService } from './error.service';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth'

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  idToken: string = '';

  constructor(private errors: ErrorService) {

  }

  async authenticated(): Promise<boolean> {
    try {
      const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};
      if (idToken) {
        this.idToken = idToken?.toString() || '';
        return true;
      }
    } catch(e) {
      console.error('failed to get auth info', e);
    }
    return false;
  }

  async authenticate(credentials: {username: string, password: string}, callback: () => void) {
    try {
      const { isSignedIn, nextStep } = await signIn({username: credentials.username, password: credentials.password});
      if (isSignedIn) {
        const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};
        this.idToken = idToken?.toString() || '';
      }
      this.errors.clear();
      return callback && callback();
    } catch(e) {
      this.errors.addError(400, 'Login failed, try again');
    }
  }

  async logout() {
    try {
      await signOut({
        global: true
      });
      this.wipeSession();
    } catch(e) {
      console.error(e);
    }
  }

  private wipeSession() {
    this.idToken = '';
    localStorage.clear();
  }

}
