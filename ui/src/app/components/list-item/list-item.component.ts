import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { PlannerEvent } from '../../types/event'
import { faCheck, faEdit, faRedo, faTrash } from '@fortawesome/free-solid-svg-icons'

import { FormsModule } from '@angular/forms'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.css'],
  imports: [FormsModule, FaIconComponent]
})
export class ListItemComponent implements OnInit {

  @Input() plannerEvent: PlannerEvent = new PlannerEvent()

  @Output() itemToDelete = new EventEmitter<PlannerEvent>()
  @Output() itemToUpdate = new EventEmitter<PlannerEvent>()
  @Output() itemToEdit = new EventEmitter<PlannerEvent>()

  faEdit = faEdit
  faCheck = faCheck
  faRedo = faRedo
  faTrash = faTrash

  showButtons = false
  updateAction = ''
  updateTitle = ''

  editing = false

  constructor() {
  }

  ngOnInit() {
    this.updateAction = this.plannerEvent.eventStatus === 'TO_DO' ? 'faCheck' : 'faRedo'
    this.updateTitle = this.plannerEvent.eventStatus === 'TO_DO' ? 'Done' : 'Redo'
  }

  deleteItem(): void {
    this.itemToDelete.emit(this.plannerEvent)
  }

  updateItem(): void {
    this.itemToUpdate.emit(this.plannerEvent)
  }

  editItem(): void {
    this.editing = true
  }

  saveEvent(): void {
    this.editing = false
    this.itemToEdit.emit(this.plannerEvent)
  }

}
