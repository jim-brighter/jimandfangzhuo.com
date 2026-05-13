import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

type AlbumItem = {
  albumId: string;
  albumName: string;
  coverImageObjectKey: string;
  createdAt: number;
};

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Credentials': true
};

const tableName = process.env.ALBUM_METADATA_TABLE!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const s3 = new S3Client({});

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

      const albumName = result.Item.albumName;

      const bucketContents = await s3.send(new ListObjectsV2Command({
        Bucket: process.env.IMAGES_BUCKET,
        Prefix: `${albumName}/`
      }));

      return response(200, bucketContents.Contents);
    }

    const items: AlbumItem[] = [];
    let lastKey: Record<string, unknown> | undefined;

    do {
      const result = await ddb.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: lastKey }));
      items.push(...((result.Items ?? []) as AlbumItem[]));
      lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);

    return response(200, { items });
  } catch (err) {
    console.error('images handler error', err);
    return response(500, { message: 'Internal server error' });
  }
};
