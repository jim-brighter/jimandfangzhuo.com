import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { Amplify } from 'aws-amplify';
Amplify.configure({
  Auth: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_PyYSUal4X',
      userPoolWebClientId: '1d7iiv4lebj54bhq29lf6fopru',
      authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
