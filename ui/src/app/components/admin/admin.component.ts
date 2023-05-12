import { Component } from '@angular/core';
import { EventService } from '../../services/event.service';
import { PlannerEvent } from '../../types/event';

import { faTrashRestore, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AuthenticationService } from '../../services/authentication.service';
import { NavigationEnd, Router } from '@angular/router';

const TO_DO = 'TO_DO';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {

  events: PlannerEvent[] = [];

  faTrashRestore = faTrashRestore;
  faTrash = faTrash;

  descriptionText = '';
  eventTitle = '';

  isLoading = true;

  navigationSubscription

  constructor(private eventService: EventService,
    private authenticator: AuthenticationService,
    private router: Router) {

    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd && this.authenticated()) {
        this.populateEvents();
      }
    });
  }

  authenticated(): boolean {
    return this.authenticator.authenticated;
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

}
