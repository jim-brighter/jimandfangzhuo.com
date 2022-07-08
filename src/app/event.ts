export class PlannerEvent {
    id: number;
    title: string;
    description: string;
    eventType: string;
    eventComments: string[];
    eventStatus: string;

    clear(): void {
        this.id = null;
        this.title = null;
        this.description = null;
        this.eventType = null;
        this.eventComments = null;
        this.eventStatus = null;
    }
}
