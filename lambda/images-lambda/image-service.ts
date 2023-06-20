import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Image } from './image';
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

const saveImages = async(body: any): Promise<void> => {
    try {
        const imageData: string = body.imageData;

        const splitImageData = imageData.split(',');

        const base64EncodedImage = splitImageData[1];
        const data: Buffer = Buffer.from(base64EncodedImage, 'base64')

        const prefix: string = splitImageData[0];
        const contentType: string = prefix.split(';')[0].split(':')[1];
        const extension: string = contentType.split('/')[1];
        const key: string = `${crypto.randomUUID()}.${extension}`;

        const s3PutCommand: PutObjectCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            ACL: 'public-read',
            Body: data
        });
        await s3.send(s3PutCommand);

        const ddbPutCommand: PutCommand = new PutCommand({
            TableName: imagesTable,
            Item: {
                imageId: crypto.randomUUID(),
                s3ObjectKey: key
            }
        });
        await ddb.send(ddbPutCommand);
    } catch(e) {
        console.error(`Failed to upload images`, e);
        throw e;
    }
}

export {
    getAllImages,
    saveImages
}
