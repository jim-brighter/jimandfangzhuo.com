import * as aws from 'aws-sdk';
import { Event } from './event';

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const eventsTable = process.env.EVENTS_TABLE;

const createEvent = (event: Event) => {

}

export {
    createEvent
}
