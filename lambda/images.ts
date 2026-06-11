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
  presignedUrl: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Credentials': true
};

const tableName = process.env.ALBUM_METADATA_TABLE!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const bucketName = process.env.IMAGES_BUCKET!;
const thumbnailBucketName = process.env.THUMBNAILS_BUCKET!;
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
      const offsetToken = event.queryStringParameters?.nextPageToken;

      // 1. Fetch all S3 objects in the album prefix
      let allObjects: any[] = [];
      let s3ContinuationToken: string | undefined = undefined;
      do {
        const bucketContents: any = await s3.send(new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: `${albumName}/`,
          ContinuationToken: s3ContinuationToken
        }));
        if (bucketContents.Contents) {
          allObjects.push(...bucketContents.Contents);
        }
        s3ContinuationToken = bucketContents.NextContinuationToken;
      } while (s3ContinuationToken);

      if (allObjects.length === 0) {
        return response(200, {
          images: [],
          nextPageToken: undefined
        });
      }

      // 2. Group keys by base path to associate Live Photo images and videos
      const groups: Record<string, { imageKey?: string; videoKey?: string }> = {};
      for (const object of allObjects) {
        if (!object.Key) continue;
        const extIndex = object.Key.lastIndexOf('.');
        const baseKey = extIndex !== -1 ? object.Key.slice(0, extIndex) : object.Key;
        const ext = extIndex !== -1 ? object.Key.slice(extIndex + 1).toLowerCase() : '';

        if (!groups[baseKey]) {
          groups[baseKey] = {};
        }

        if (['mp4', 'mov', 'm4v', 'avi'].includes(ext)) {
          groups[baseKey].videoKey = object.Key;
        } else {
          groups[baseKey].imageKey = object.Key;
        }
      }

      // 3. Sort groups lexicographically (preserves S3 timestamp prefix sort)
      const sortedGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));

      // 4. Paginate the grouped array using offset token
      const pageSize = 20;
      const offset = parseInt(offsetToken || '0', 10);
      const pageGroups = sortedGroups.slice(offset, offset + pageSize);
      const hasMore = offset + pageSize < sortedGroups.length;
      const nextPageToken = hasMore ? (offset + pageSize).toString() : undefined;

      // 5. Generate signed URLs for page assets
      const albumImages = await Promise.all(
        pageGroups.map(async ([baseKey, group]) => {
          const mainKey = group.imageKey || group.videoKey!;
          const originalUrl = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: bucketName,
            Key: mainKey
          }), {
            expiresIn: 6 * 60 * 60 // 6 hours
          });

          const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: thumbnailBucketName,
            Key: mainKey
          }), {
            expiresIn: 6 * 60 * 60 // 6 hours
          });

          let videoUrl: string | null = null;
          if (group.imageKey && group.videoKey) {
            videoUrl = await getSignedUrl(s3, new GetObjectCommand({
              Bucket: bucketName,
              Key: group.videoKey
            }), {
              expiresIn: 6 * 60 * 60 // 6 hours
            });
          }

          return {
            originalUrl,
            thumbnailUrl,
            videoUrl
          };
        })
      );

      return response(200, {
        images: albumImages,
        nextPageToken
      });
    }

    const items: AlbumItem[] = [];
    let lastKey: Record<string, unknown> | undefined;

    do {
      const result = await ddb.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: lastKey }));
      for (const dynamoItem of result.Items!) {
        const item = dynamoItem as AlbumItem;
        item.presignedUrl = await getSignedUrl(s3, new GetObjectCommand({
          Bucket: thumbnailBucketName,
          Key: `${item.albumName}/${item.coverImageObjectKey}`
        }), {
          expiresIn: 6 * 60 * 60 // 6 hours
        });

        items.push(item);
      }
      lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);

    return response(200, { items });
  } catch (err) {
    console.error('images handler error', err);
    return response(500, { message: 'Internal server error' });
  }
};
