import { PlannerEvent } from './event';

export class PlannerImage {
    id: number;
    digitalOceanSpaceKey: string;
    parentEvent: PlannerEvent;
    rotation: number;
}
