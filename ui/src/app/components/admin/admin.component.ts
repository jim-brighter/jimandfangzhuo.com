import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventService } from '../../services/event.service';
import { PlannerEvent } from '../../types/event';

import { faTrashRestore, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AuthenticationService } from '../../services/authentication.service';
import { NavigationEnd, Router } from '@angular/router';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoginComponent } from '../login/login.component';

const TO_DO = 'TO_DO';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css'],
    imports: [NgIf, NgFor, NgClass, FaIconComponent, LoginComponent]
})
export class AdminComponent implements OnDestroy, OnInit {

  events: PlannerEvent[] = [];

  faTrashRestore = faTrashRestore;
  faTrash = faTrash;

  descriptionText = '';
  eventTitle = '';

  isLoading = true;
  isAuthenticated = false;

  navigationSubscription

  constructor(private eventService: EventService,
    private authenticator: AuthenticationService,
    private router: Router) {

    this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
      if (e instanceof NavigationEnd && await this.authenticated()) {
        this.populateEvents();
      }
    });
  }


  ngOnInit() {
  }

  async authenticated(): Promise<boolean> {
    const authStatus = await this.authenticator.authenticated();
    this.isAuthenticated = authStatus;
    return authStatus;
  }

  updateDescriptionModal(event: PlannerEvent): void {
    this.eventTitle = event.title;
    this.descriptionText = event.description;
  }

  populateEvents(): void {
    this.eventService.getEvents().subscribe(data => {
      this.events = data;
      this.isLoading = false;
    });
  }

  restoreItem(event: PlannerEvent): void {
    event.eventStatus = TO_DO;
    const restoreArray = [event];
    this.eventService.updateEvents(restoreArray).subscribe(() => {
      this.populateEvents();
    });
  }

  permanentlyDeleteItem(event: PlannerEvent): void {
    this.eventService.deleteEvent([event.eventId]).subscribe(() => {
      this.populateEvents();
    });
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

}
