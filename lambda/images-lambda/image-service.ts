import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Image } from './image';
import { ImageUploadRequest } from './image-upload-request';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.AWS_REGION,
}),
{
    marshallOptions: {
        convertClassInstanceToMap: true
    }
});

const s3 = new S3Client({
    region: process.env.AWS_REGION
});

const imagesTable = process.env.IMAGES_TABLE || '';
const bucketName = process.env.BUCKET_NAME;

const getAllImages = async(): Promise<Array<Image>> => {
    try {
        const allImages = await ddb.send(new ScanCommand({
            TableName: imagesTable
        }));

        return allImages.Items ? allImages.Items.map(i => i as Image) : [];
    } catch(e) {
        console.error(`Failed to retrieve all images`, e);
        throw e;
    }
}

const saveImages = async(body: ImageUploadRequest): Promise<void> => {
    try {
        const contentType: string = body.type;
        const extension: string = contentType.split('/')[1];
        const key = `${crypto.randomUUID()}.${extension}`;

        console.log(`Saving ${body.filename} as ${key}`);

        const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            ContentEncoding: '',
            ContentLength: body.data.length,
            ACL: 'public-read',
            Body: body.data
        });
        await s3.send(putCommand);

        const image = {
            imageId: crypto.randomUUID(),
            s3ObjectKey: key
        };
        await ddb.send(new PutCommand({
            TableName: imagesTable,
            Item: image
        }));
    } catch(e) {
        console.error(`Failed to upload images`, e);
        throw e;
    }
}

export {
    getAllImages,
    saveImages
}
