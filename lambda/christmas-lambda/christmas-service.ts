import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ChristmasItem, ChristmasItemImpl } from './christmas-types';
import * as crypto from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.AWS_REGION
}),
{
    marshallOptions: {
        convertClassInstanceToMap: true
    }
});

const christmasTable = process.env.CHRISTMAS_TABLE || '';

const createItem = async(item: ChristmasItem): Promise<ChristmasItem> => {
    item.itemId = crypto.randomUUID();
    item.createdTime = new Date().getTime();
    item.itemYear = new Date().getFullYear();

    try {
        await ddb.send(new PutCommand({
            TableName: christmasTable,
            Item: item
        }));
    } catch(e) {
        console.error(`Error saving new item with name '${item.itemName}'`, e);
        throw e;
    }

    return item;
}

const getAllItems = async(): Promise<Array<ChristmasItem>> => {
    try {
        const allItems = await ddb.send(new ScanCommand({
            TableName: christmasTable,
            ExpressionAttributeValues: {
                ':itemYear': new Date().getFullYear()
            },
            FilterExpression: 'itemYear = :itemYear'
        }));

        return allItems.Items ? allItems.Items.map(i => i as ChristmasItem).sort((a, b) => a.createdTime - b.createdTime) : [];
    } catch(e) {
        console.error(`Failed to retrieve items for current year`, e);
        throw e;
    }
}

export {
    createItem,
    getAllItems
}
