import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Image } from './image';
import * as imageService from './image-service';


export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const headers = {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': true
    };
    switch(event.httpMethod) {
        case 'GET':
            if (event.queryStringParameters?.imageId) {
                try {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            base64Image: await imageService.getImage(event.queryStringParameters.imageId)
                        })
                    }
                } catch(e) {
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            errorMessage: `Error retrieving image ${event.queryStringParameters.imageId}`
                        })
                    }
                }
            }
            else {
                try {
                    const allImages: Image[] = await imageService.getAllImages();
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify(allImages)
                    }
                } catch(e) {
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            errorMessage: 'Error retrieving all images'
                        })
                    }
                }
            }
        case 'POST':
            try {
                const body = event.body && JSON.parse(event.body);
                await imageService.saveImages(body);
                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify({
                        statusMessage: 'OK'
                    })
                }
            } catch(e) {
                console.error(e);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        errorMessage: 'Error uploading images'
                    })
                }
            }
        default:
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    errorMessage: 'Operation not supported'
                })
            }
    }
}
