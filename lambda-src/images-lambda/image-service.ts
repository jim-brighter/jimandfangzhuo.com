import * as aws from 'aws-sdk';
import { Image } from './image';
import * as crypto from 'crypto';

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const imagesTable = process.env.IMAGES_TABLE || '';

const getAllImages = async(): Promise<Array<Image>> => {
    try {
        const allImages = await ddb.scan({
            TableName: imagesTable
        }).promise();

        return allImages.Items ? allImages.Items.map(i => i as Image) : [];
    } catch(e) {
        console.error(`Failed to retrieve all images`, e);
        throw e;
    }
}

export {
    getAllImages
}
