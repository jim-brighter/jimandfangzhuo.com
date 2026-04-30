import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Credentials': true
};

const tableName = process.env.ALBUM_METADATA_TABLE!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const response = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: { ...corsHeaders },
  body: JSON.stringify(body)
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const albumId = event.pathParameters?.albumId;

  try {
    if (albumId) {
      const result = await ddb.send(new GetCommand({ TableName: tableName, Key: { albumId } }));
      if (!result.Item) {
        return response(404, { message: `Album ${albumId} not found` });
      }
      return response(200, result.Item);
    }

    const items: Record<string, unknown>[] = [];
    let lastKey: Record<string, unknown> | undefined;

    do {
      const result = await ddb.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: lastKey }));
      items.push(...(result.Items ?? []));
      lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);

    return response(200, { items });
  } catch (err) {
    console.error('images handler error', err);
    return response(500, { message: 'Internal server error' });
  }
};
