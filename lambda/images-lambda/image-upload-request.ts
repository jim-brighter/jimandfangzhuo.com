interface IImageUploadRequest {
    filename: string;
    type: string;
    name: string;
    data: Buffer;
}

export type ImageUploadRequest = IImageUploadRequest;

export class ImageUpload implements ImageUploadRequest {
    filename: string;
    type: string;
    name: string;
    data: Buffer;

    constructor(json: any) {
        this.filename = json.filename;
        this.type = json.type;
        this.name = json.name;
        this.data = json.data;
    }
}
