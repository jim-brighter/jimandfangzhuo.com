export interface Event {
    id: string;
    title: string;
    description: string;
    eventType: 'TO_DO' | 'TO_EAT' | 'TO_COOK' | 'TO_GO' | 'TO_WATCH' | 'TO_BUY';
    eventStatus: 'TO_DO' | 'COMPLETE' | 'DELETED';
    createdTime: Date;
}
