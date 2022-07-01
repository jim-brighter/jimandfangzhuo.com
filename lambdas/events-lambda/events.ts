import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

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
                event.body && console.log(JSON.parse(event.body));
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
