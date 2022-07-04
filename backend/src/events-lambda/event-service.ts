import * as aws from 'aws-sdk';
import { Event } from './event';
import * as crypto from 'crypto';

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const eventsTable = process.env.EVENTS_TABLE || '';
const eventTypeIndex = process.env.EVENT_TYPE_INDEX || '';

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

const getAllEvents = async (): Promise<Array<Event>> => {
    try {
        const allEvents = await ddb.scan({
            TableName: eventsTable
        }).promise();

        return allEvents.Items ? allEvents.Items.map(i => i as Event) : [];
    } catch(e) {
        console.error(`Failed to retrieve all events`, e);
        throw e;
    }
}

const getEventsByType = async (eventType: string): Promise<Array<Event>> => {
    try {
        const eventsByType = await ddb.query({
            TableName: eventsTable,
            IndexName: eventTypeIndex,
            ExpressionAttributeValues: {
                ':eventType': eventType
            },
            KeyConditionExpression: 'eventType = :eventType'
        }).promise();

        return eventsByType.Items ? eventsByType.Items.map(i => i as Event) : [];
    } catch(e) {
        console.error(`Failed to retrieve events with type ${eventType}`, e);
        throw e;
    }
}

export {
    createEvent,
    getAllEvents,
    getEventsByType
}
