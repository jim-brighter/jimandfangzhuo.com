import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable } from '@angular/core';
import { HttpClientModule, HttpRequest, HttpHandler, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from '../components/app/app.component';
import { CommentsComponent } from '../components/comments/comments.component';
import { ListsComponent } from '../components/lists/lists.component';
import { DetailsComponent } from '../components/details/details.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from '../components/home/home.component';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { EventService } from '../services/event.service';
import { ListItemComponent } from '../components/list-item/list-item.component';
import { CommentService } from '../services/comment.service';
import { CommentItemComponent } from '../components/comment-item/comment-item.component';
import { UploadComponent } from '../components/upload/upload.component';
// import { FileUploadModule } from 'ng2-file-upload';
import { ImageService } from '../services/image.service';
import { PhotosComponent } from '../components/photos/photos.component';
import { LoginComponent } from '../components/login/login.component';
import { AuthenticationService } from '../services/authentication.service';
import { ErrorService } from '../services/error.service';
import { AdminComponent } from '../components/admin/admin.component';
import { LogoutComponent } from '../components/logout/logout.component';

@Injectable()
export class XhrInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const xhr = req.clone({
      headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
    });
    return next.handle(xhr);
  }
}

@NgModule({
  declarations: [
    AppComponent,
    CommentsComponent,
    ListsComponent,
    DetailsComponent,
    HomeComponent,
    NavbarComponent,
    ListItemComponent,
    CommentItemComponent,
    UploadComponent,
    PhotosComponent,
    LoginComponent,
    AdminComponent,
    LogoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule,
    AmplifyAuthenticatorModule
  ],
  providers: [
    EventService,
    CommentService,
    ImageService,
    AuthenticationService,
    ErrorService,
    {provide: HTTP_INTERCEPTORS, useClass: XhrInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
