import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable } from '@angular/core';
import { HttpClientModule, HttpRequest, HttpHandler, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { CommentsComponent } from './comments/comments.component';
import { ListsComponent } from './lists/lists.component';
import { DetailsComponent } from './details/details.component';
import { AppRoutingModule } from './/app-routing.module';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { EventService } from './event.service';
import { ListItemComponent } from './list-item/list-item.component';
import { CommentService } from './comment.service';
import { CommentItemComponent } from './comment-item/comment-item.component';
import { UploadComponent } from './upload/upload.component';
import { FileUploadModule } from 'ng2-file-upload';
import { ImageService } from './image.service';
import { PhotosComponent } from './photos/photos.component';
import { LoginComponent } from './login/login.component';
import { AuthenticationService } from './authentication.service';
import { ErrorService } from './error.service';
import { AdminComponent } from './admin/admin.component';
import { LogoutComponent } from './logout/logout.component';

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
    FileUploadModule,
    FontAwesomeModule
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
