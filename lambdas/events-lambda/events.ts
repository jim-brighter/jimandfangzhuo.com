import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Event, validateEvent } from './event';

export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    switch(event.httpMethod) {
        case 'GET':
            break;
        case 'POST':
            if (event.path.endsWith('/delete')) {

            }
            else if (event.path.endsWith('/update')) {

            }
            else {
                const body: Event = event.body && JSON.parse(event.body);
                if (!validateEvent(body)) {
                    return {
                        statusCode: 400,
                        body: 'Invalid event'
                    }
                }
                console.log(body);
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
