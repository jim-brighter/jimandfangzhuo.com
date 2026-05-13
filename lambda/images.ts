import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

const bucketName = process.env.IMAGES_BUCKET;
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
        Bucket: bucketName,
        Prefix: `${albumName}/`
      }));

      if (!bucketContents.Contents) {
        return response(500, { message: "Something went wrong, please try again" });
      }

      const presignedUrls = await Promise.all(bucketContents.Contents.map(object => {
        return getSignedUrl(s3, new GetObjectCommand({
          Bucket: bucketName,
          Key: object.Key
        }), {
          expiresIn: 6 * 60 * 60 // 6 hours
        });
      }));

      return response(200, presignedUrls);
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
