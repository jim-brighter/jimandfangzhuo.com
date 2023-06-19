import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Image } from './image';
import * as multipartParser from 'parse-multipart-data';
import * as imageService from './image-service';
import { ImageUpload } from './image-upload-request';


export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const headers = {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': true
    };
    switch(event.httpMethod) {
        case 'GET':
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
        case 'POST':
            try {
                const boundary = multipartParser.getBoundary(event.headers['content-type'] || '');
                let body = multipartParser.parse(Buffer.from(event.body || ''), boundary);
                body = body.filter(i => i.name === 'images');
                await imageService.saveImages(body[0] as ImageUpload);
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
