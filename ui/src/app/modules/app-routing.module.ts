import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DetailsComponent } from '../components/details/details.component';
import { HomeComponent } from '../components/home/home.component';
import { PhotosComponent } from '../components/photos/photos.component';
import { AdminComponent } from '../components/admin/admin.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'details/:list', component: DetailsComponent, runGuardsAndResolvers: 'always'},
  {path: 'photos', component: PhotosComponent, runGuardsAndResolvers: 'always'},
  {path: 'admin', component: AdminComponent, runGuardsAndResolvers: 'always'}
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }
