import * as aws from 'aws-sdk';
import { Event } from './event';
import * as crypto from 'crypto';

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const eventsTable = process.env.EVENTS_TABLE || '';

const createEvent = async (event: Event): Promise<Event> => {
    event.eventId = crypto.randomUUID();
    event.eventStatus = 'TO_DO';
    event.createdTime = new Date().getTime();

    try {
        await ddb.put({
            TableName: eventsTable,
            Item: event
        }).promise();
    } catch(e) {
        console.error(`Error saving new event with title ${event.title}`, JSON.stringify(e));
        throw e;
    }

    return event;
}

export {
    createEvent
}
