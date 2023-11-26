interface IChristmasItem {
    itemId: string | null;
    itemName: string | null;
    itemLink: string | null;
    itemYear: number | null;
    createdTime: number | null;
}

export type ChristmasItem = IChristmasItem;

export class ChristmasItemImpl implements ChristmasItem {
    itemId: string | null;
    itemName: string | null;
    itemLink: string | null;
    itemYear: number | null;
    createdTime: number | null;

    constructor(json: ChristmasItem) {
        this.itemId = json.itemId || null;
        this.itemName = json.itemName || null;
        this.itemLink = json.itemLink || null;
        this.itemYear = json.itemYear || null;
        this.createdTime = json.createdTime || null;
    }
}
