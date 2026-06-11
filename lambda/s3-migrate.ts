import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, _Object, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-1'
});
const IMAGES_BUCKET = 'jimandfangzhuo.com-images-us-east-1';
const THUMBNAILS_BUCKET = 'jimandfangzhuo.com-thumbnails-us-east-1';

function encodeS3CopySource(bucket: string, key: string): string {
  const encodedKey = key
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return `${bucket}/${encodedKey}`;
}

async function migrate() {
  console.log('Listing S3 objects from IMAGES bucket...');
  let continuationToken: string | undefined = undefined;
  const objects: _Object[] = [];
  do {
    const listRes: ListObjectsV2CommandOutput = await s3.send(new ListObjectsV2Command({
      Bucket: IMAGES_BUCKET,
      ContinuationToken: continuationToken
    }));
    if (listRes.Contents) {
      objects.push(...listRes.Contents);
    }
    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  console.log(`Found ${objects.length} objects total. Finding mismatched video-image pairs...`);

  // Group by base path (album/baseName)
  // Key format: albumName/timestamp-baseName.ext
  // e.g. "wedding/1620000000-IMG_1234.HEIC" -> baseKey: "wedding/IMG_1234"
  const groups: Record<string, {
    image?: { key: string; timestamp: string; ext: string };
    video?: { key: string; timestamp: string; ext: string };
  }> = {};

  for (const obj of objects) {
    const key = obj.Key;
    if (!key) continue;

    // Parse key
    const parts = key.split('/');
    if (parts.length < 2) continue;
    const albumName = parts[0];
    const filename = parts.slice(1).join('/');

    const dashIndex = filename.indexOf('-');
    if (dashIndex === -1) continue;
    const timestamp = filename.substring(0, dashIndex);
    const rest = filename.substring(dashIndex + 1);

    const extIndex = rest.lastIndexOf('.');
    const baseName = extIndex !== -1 ? rest.substring(0, extIndex) : rest;
    const ext = extIndex !== -1 ? rest.substring(extIndex + 1).toLowerCase() : '';

    const groupKey = `${albumName}/${baseName}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {};
    }

    if (['mp4', 'mov', 'm4v', 'avi'].includes(ext)) {
      groups[groupKey].video = { key, timestamp, ext };
    } else {
      groups[groupKey].image = { key, timestamp, ext };
    }
  }

  // Find mismatched pairs
  const migrations: { oldVideoKey: string; newVideoKey: string }[] = [];

  for (const [, group] of Object.entries(groups)) {
    if (group.image && group.video) {
      if (group.image.timestamp !== group.video.timestamp) {
        // We have a mismatch!
        // The new video key should use the image's timestamp:
        // old: album/videoTimestamp-base.mov
        // new: album/imageTimestamp-base.mov
        const parts = group.video.key.split('/');
        const albumName = parts[0];
        const filename = parts.slice(1).join('/');
        const dashIndex = filename.indexOf('-');
        const rest = filename.substring(dashIndex + 1);

        const newVideoKey = `${albumName}/${group.image.timestamp}-${rest}`;

        migrations.push({
          oldVideoKey: group.video.key,
          newVideoKey
        });
      }
    }
  }

  if (migrations.length === 0) {
    console.log('No mismatched timestamps found. All S3 objects are already aligned!');
    return;
  }

  console.log(`Found ${migrations.length} mismatched video-image pairs:`);
  for (const m of migrations) {
    console.log(`- ${m.oldVideoKey} -> ${m.newVideoKey}`);
  }

  console.log('\nStarting migration in S3...');
  for (const m of migrations) {
    console.log(`Migrating video asset: ${m.oldVideoKey}`);

    // Copy video in IMAGES_BUCKET
    await s3.send(new CopyObjectCommand({
      Bucket: IMAGES_BUCKET,
      CopySource: encodeS3CopySource(IMAGES_BUCKET, m.oldVideoKey),
      Key: m.newVideoKey
    }));

    // Delete old video in IMAGES_BUCKET
    await s3.send(new DeleteObjectCommand({
      Bucket: IMAGES_BUCKET,
      Key: m.oldVideoKey
    }));

    // Now check if thumbnail exists in THUMBNAILS_BUCKET and rename it too
    try {
      await s3.send(new CopyObjectCommand({
        Bucket: THUMBNAILS_BUCKET,
        CopySource: encodeS3CopySource(THUMBNAILS_BUCKET, m.oldVideoKey),
        Key: m.newVideoKey
      }));
      await s3.send(new DeleteObjectCommand({
        Bucket: THUMBNAILS_BUCKET,
        Key: m.oldVideoKey
      }));
      console.log(`  Successfully migrated video thumbnail: ${m.oldVideoKey}`);
    } catch {
      // Thumbnail might not exist, that's fine
      console.log(`  No video thumbnail found or failed to migrate thumbnail for ${m.oldVideoKey}`);
    }
  }

  console.log('S3 Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
});
