import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Image, PlannerImage } from './image';
import * as imageService from './image-service';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': true,
  };
  switch (event.httpMethod) {
    case 'GET':
      try {
        const allImages: Image[] = await imageService.getAllImages();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(allImages),
        };
      } catch (e) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            errorMessage: 'Error retrieving all images',
          }),
        };
      }
    case 'POST':
      try {
        // TODO
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            // TODO
            errorMessage: 'Error retrieving all images',
          }),
        };
      } catch (e) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            errorMessage: 'Error uploading images',
          }),
        };
      }
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          errorMessage: 'Operation not supported',
        }),
      };
  }
};
