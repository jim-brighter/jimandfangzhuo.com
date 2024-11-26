import { enableProdMode, importProvidersFrom } from '@angular/core';

import { XhrInterceptor } from './app/modules/app.module';
import { environment } from './environments/environment';

import { Amplify } from 'aws-amplify';
import { EventService } from './app/services/event.service';
import { CommentService } from './app/services/comment.service';
import { ImageService } from './app/services/image.service';
import { AuthenticationService } from './app/services/authentication.service';
import { ErrorService } from './app/services/error.service';
import { ChristmasService } from './app/services/christmas.service';
import { HTTP_INTERCEPTORS, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/modules/app-routing.module';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { AppComponent } from './app/components/app/app.component';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_PyYSUal4X',
      userPoolClientId: '1d7iiv4lebj54bhq29lf6fopru'
    }
  }
});

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, FormsModule, FontAwesomeModule, AmplifyAuthenticatorModule),
        EventService,
        CommentService,
        ImageService,
        AuthenticationService,
        ErrorService,
        ChristmasService,
        { provide: HTTP_INTERCEPTORS, useClass: XhrInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi())
    ]
})
  .catch(err => console.error(err));
