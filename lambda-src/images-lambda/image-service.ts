import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Image } from './image';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.AWS_REGION,
}));

const imagesTable = process.env.IMAGES_TABLE || '';

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

export {
    getAllImages
}
