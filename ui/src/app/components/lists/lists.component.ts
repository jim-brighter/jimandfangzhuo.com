import { Component, Input, OnChanges } from '@angular/core'

import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'

import { EventService } from '../../services/event.service'
import { PlannerEvent } from '../../types/event'
import { NgIf, NgFor } from '@angular/common'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'
import { ListItemComponent } from '../list-item/list-item.component'
import { FormsModule } from '@angular/forms'

const listMap: { [id: string]: string } = {
  'TO_DO': 'Done',
  'TO_EAT': 'Eaten',
  'TO_COOK': 'Cooked',
  'TO_GO': 'Went',
  'TO_WATCH': 'Watched',
  'TO_BUY': 'Bought'
}

const TO_DO = 'TO_DO'
const COMPLETE = 'COMPLETE'
const DELETED = 'DELETED'

@Component({
    selector: 'app-lists',
    templateUrl: './lists.component.html',
    styleUrls: ['./lists.component.css'],
    imports: [NgIf, FaIconComponent, NgFor, ListItemComponent, FormsModule]
})
export class ListsComponent implements OnChanges {

  listTitle: string = ''
  completedListTitle: string = ''

  listData: PlannerEvent[] = []
  toDoEvents: PlannerEvent[] = []
  completeEvents: PlannerEvent[] = []

  newEvent: PlannerEvent = new PlannerEvent()
  editing = false

  isLoading = true

  faAngleDown = faAngleDown
  faAngleRight = faAngleRight

  expandToDo = false
  expandDone = false

  @Input() list: string = ''

  constructor(private eventService: EventService) { }

  ngOnChanges() {
    this.isLoading = true
    this.setListToShow()
    this.populateLists()
    this.expandToDo = true
    this.expandDone = false
  }

  setListToShow(): void {
    this.listTitle = this.makePresentable(this.list)
    this.completedListTitle = listMap[this.list]
  }

  populateLists(): void {
    this.eventService.getEventsByType(this.list).subscribe(data => {
      this.listData = data
      this.toDoEvents = this.listData.filter(event => event.eventStatus === TO_DO)
      this.completeEvents = this.listData.filter(event => event.eventStatus === COMPLETE)
      this.isLoading = false
    })
  }

  makePresentable(s: string): string {
    s = s.toLowerCase().replace('_', ' ')
    for (let i = 0; i < s.length; i++) {
      if (i === 0 || s.charAt(i - 1) === ' ') {
        s = s.substring(0, i) + s.charAt(i).toUpperCase() + s.substring(i + 1)
      }
    }
    return s
  }

  saveNewEvent(): void {
    this.newEvent.eventType = this.list
    this.eventService.saveEvent(this.newEvent).subscribe(data => {
      this.toDoEvents.push(data)
      this.newEvent.clear()
    })
  }

  onDelete(toDelete: PlannerEvent): void {
    toDelete.eventStatus = DELETED
    const toDeleteArray: PlannerEvent[] = [toDelete]
    this.eventService.updateEvents(toDeleteArray).subscribe(() => {
      this.populateLists()
    })
  }

  onComplete(toComplete: PlannerEvent): void {
    toComplete.eventStatus = COMPLETE
    const toCompleteArray = [toComplete]
    this.eventService.updateEvents(toCompleteArray).subscribe(() => {
      this.populateLists()
    })
  }

  onRedo(toRedo: PlannerEvent): void {
    toRedo.eventStatus = TO_DO
    const toRedoArray = [toRedo]
    this.eventService.updateEvents(toRedoArray).subscribe(() => {
      this.populateLists()
    })
  }

  onEdit(toEdit: PlannerEvent): void {
    this.eventService.updateEvents([toEdit]).subscribe(() => {
      this.populateLists()
    })
  }

  toggleExpandToDo(): void {
    this.expandToDo = !this.expandToDo
  }

  toggleExpandDone(): void {
    this.expandDone = !this.expandDone
  }

}
