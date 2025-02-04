export class PlannerEvent {
  eventId: string = ''
  title: string = ''
  description: string = ''
  eventType: string = ''
  eventStatus: string = ''
  createdTime: number = 0

  clear(): void {
    this.eventId = ''
    this.title = ''
    this.description = ''
    this.eventType = ''
    this.eventStatus = ''
    this.createdTime = 0
  }
}
