import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service';
import { PlannerEvent } from '../event';

import { faTrashRestore } from '@fortawesome/free-solid-svg-icons';

const TO_DO = 'TO_DO';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  events: PlannerEvent[];

  faTrashRestore = faTrashRestore;

  descriptionText = '';
  eventTitle = '';

  constructor(private eventService: EventService) { }

  ngOnInit() {
    this.populateEvents();
  }

  updateDescriptionModal(event: PlannerEvent): void {
    this.eventTitle = event.title;
    this.descriptionText = event.description;
  }

  populateEvents(): void {
    this.eventService.getEvents().subscribe(data => {
      this.events = data;
    });
  }

  restoreItem(event: PlannerEvent): void {
    event.eventStatus = TO_DO;
    const restoreArray = [event];
    this.eventService.updateEvents(restoreArray).subscribe(() => {
      this.populateEvents();
    });
  }

}
