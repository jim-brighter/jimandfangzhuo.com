interface IImage {
    imageId: string | null;
    s3ObjectKey: string | null;

    validateNewImage(): boolean;
}

export type Image = IImage;

export class PlannerImage implements Image {
    imageId: string | null;
    s3ObjectKey: string | null;

    constructor(json: Image) {
        this.imageId = json.imageId || null;
        this.s3ObjectKey = json.s3ObjectKey || null;

    }

    validateNewImage(): boolean {
        return this.s3ObjectKey != undefined && this.s3ObjectKey != null;
    }
}
