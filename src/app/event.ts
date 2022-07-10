export class PlannerEvent {
    eventId: string;
    title: string;
    description: string;
    eventType: string;
    eventStatus: string;
    createdTime: number;

    clear(): void {
        this.eventId = null;
        this.title = null;
        this.description = null;
        this.eventType = null;
        this.eventStatus = null;
        this.createdTime = null;
    }
}
