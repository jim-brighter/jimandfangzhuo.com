interface IEvent {
    eventId: string | null
    title: string | null
    description: string | null
    eventType: 'TO_DO' | 'TO_EAT' | 'TO_COOK' | 'TO_GO' | 'TO_WATCH' | 'TO_BUY'
    eventStatus: 'TO_DO' | 'COMPLETE' | 'DELETED'
    createdTime: number | null

    validateNewEvent(): boolean
    validateUpdateEvent(): boolean
}

export type Event = IEvent

export const validTypes = [
    'TO_DO',
    'TO_EAT',
    'TO_COOK',
    'TO_GO',
    'TO_WATCH',
    'TO_BUY'
]

export const validStatuses = [
    'TO_DO',
    'COMPLETE',
    'DELETED'
]

export class PlannerEvent implements Event {
    eventId: string | null
    title: string | null
    description: string | null
    eventType: 'TO_DO' | 'TO_EAT' | 'TO_COOK' | 'TO_GO' | 'TO_WATCH' | 'TO_BUY'
    eventStatus: 'TO_DO' | 'COMPLETE' | 'DELETED'
    createdTime: number | null

    constructor(json: Event) {
        this.eventId = json.eventId || null
        this.title = json.title || null
        this.description = json.description || null
        this.eventType = json.eventType || null
        this.eventStatus = json.eventStatus || null
        this.createdTime = json.createdTime || null
    }

    validateNewEvent(): boolean {
        return this.title != undefined && this.title != null
        && this.eventType != undefined && this.eventType != null && validTypes.includes(this.eventType)
    }

    validateUpdateEvent(): boolean {
        return this.title != undefined && this.title != null
        && this.eventStatus != undefined && this.eventStatus != null && validStatuses.includes(this.eventStatus)
    }
}
