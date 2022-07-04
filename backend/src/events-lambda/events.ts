import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Event, PlannerEvent } from './event';
import * as eventService from './event-service';

export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    switch(event.httpMethod) {
        case 'GET':
            if (event.pathParameters && event.pathParameters.eventType) {
                try {
                    const eventsByType: Event[] = await eventService.getEventsByType(event.pathParameters.eventType);
                    return {
                        statusCode: 200,
                        body: JSON.stringify(eventsByType)
                    }
                } catch(e) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify({
                            errorMessage: `Error retrieving events with type ${event.pathParameters.eventType}`
                        })
                    }
                }
            }
            else {
                try {
                    const allEvents: Event[] =  await eventService.getAllEvents();
                    return {
                        statusCode: 200,
                        body: JSON.stringify(allEvents)
                    }
                } catch(e) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify({
                            errorMessage: `Error retrieving all events`
                        })
                    }
                }
            }
        case 'POST':
            let eventContent: Event = new PlannerEvent(event.body && JSON.parse(event.body));
            if (eventContent.validateNewEvent()) {
                try {
                    eventContent = await eventService.createEvent(eventContent);
                    return {
                        statusCode: 201,
                        body: JSON.stringify(eventContent)
                    }
                } catch (e) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify({
                            errorMessage: `Error creating event with title ${eventContent.title}`
                        })
                    }
                }
            }
            else {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        errorMessage: 'Invalid event'
                    })
                }
            }
        case 'PUT':
            const eventsContents: Event[] = event.body && JSON.parse(event.body).map((i: any) => {
                return new PlannerEvent(i);
            });

            for (let updateEvent of eventsContents) {
                if (!updateEvent.validateUpdateEvent()) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            errorMessage: `Invalid event with id ${updateEvent.eventId}`
                        })
                    }
                }
            }

            try {
                await eventService.updateEvents(eventsContents);
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: 'Success'
                    })
                }
            } catch(e) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        errorMessage: `Error updating events`
                    })
                }
            }
        default:
            return {
                statusCode: 405,
                body: JSON.stringify({
                    errorMessage: 'Operation not supported'
                })
            }
    }
}
