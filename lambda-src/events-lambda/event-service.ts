import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Event } from './event';
import * as crypto from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.AWS_REGION,
}),
{
    marshallOptions: {
        convertClassInstanceToMap: true
    }
});

const eventsTable = process.env.EVENTS_TABLE || '';
const eventTypeIndex = process.env.EVENT_TYPE_INDEX || '';

const createEvent = async (event: Event): Promise<Event> => {
    event.eventId = crypto.randomUUID();
    event.eventStatus = 'TO_DO';
    event.createdTime = new Date().getTime();

    try {
        await ddb.send(new PutCommand({
            TableName: eventsTable,
            Item: event
        }));
    } catch(e) {
        console.error(`Error saving new event with title ${event.title}`, e);
        throw e;
    }

    return event;
}

const getAllEvents = async (): Promise<Array<Event>> => {
    try {
        const allEvents = await ddb.send(new ScanCommand({
            TableName: eventsTable
        }));

        return allEvents.Items ? allEvents.Items.map(i => i as Event).sort((a, b) => a.createdTime - b.createdTime) : [];
    } catch(e) {
        console.error(`Failed to retrieve all events`, e);
        throw e;
    }
}

const getEventsByType = async (eventType: string): Promise<Array<Event>> => {
    try {
        const eventsByType = await ddb.send(new QueryCommand({
            TableName: eventsTable,
            IndexName: eventTypeIndex,
            ExpressionAttributeValues: {
                ':eventType': eventType,
                ':deleted': 'DELETED'
            },
            KeyConditionExpression: 'eventType = :eventType',
            FilterExpression: 'eventStatus <> :deleted'
        }));

        return eventsByType.Items ? eventsByType.Items.map(i => i as Event).sort((a, b) => a.createdTime - b.createdTime) : [];
    } catch(e) {
        console.error(`Failed to retrieve events with type ${eventType}`, e);
        throw e;
    }
}

const updateEvents = async (events: Event[]) => {
    try {
        const updates = events.map(async (event) => {
            await ddb.send(new UpdateCommand({
                TableName: eventsTable,
                Key: {
                    eventId: event.eventId
                },
                UpdateExpression: 'set eventStatus = :eventStatus, description = :description, title = :title',
                ExpressionAttributeValues: {
                    ':eventStatus': event.eventStatus,
                    ':description': event.description,
                    ':title': event.title
                }
            }));
        });

        await Promise.all(updates);
    } catch(e) {
        console.error(`Failed to update events`, e);
        throw e;
    }
}

const deleteEvents = async (eventIds: string[]) => {
    try {
        const deletes = eventIds.map(async (id: string) => {
            await ddb.send(new DeleteCommand({
                TableName: eventsTable,
                Key: {
                    eventId: id
                }
            }));
        });

        await Promise.all(deletes);
    } catch(e) {
        console.error(`Failed to delete events`, e);
        throw e;
    }
}

export {
    createEvent,
    getAllEvents,
    getEventsByType,
    updateEvents,
    deleteEvents
}
