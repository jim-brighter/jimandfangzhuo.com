import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Event, PlannerEvent } from './event';
import * as eventService from './event-service';

export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    switch(event.httpMethod) {
        case 'GET':
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
        case 'POST':
            if (event.path.endsWith('/delete')) {

            }
            else if (event.path.endsWith('/update')) {

            }
            else {
                let eventContent: Event = new PlannerEvent(event.body && JSON.parse(event.body));
                if (eventContent.validate()) {
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
            }
            break;
        default:
            return {
                statusCode: 405,
                body: JSON.stringify({
                    errorMessage: 'Operation not supported'
                })
            }
    }
    return {
        statusCode: 200,
        body: `Hello from events lambda to your ${event.httpMethod} request`
    }
}
