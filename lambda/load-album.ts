import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec, execSync } from 'child_process';
import readline from 'readline';
import crypto from 'crypto';

// Initialize AWS SDK clients
const s3 = new S3Client({ region: 'us-east-1' });
const dynamo = new DynamoDBClient({ region: 'us-east-1' });

const IMAGES_BUCKET = 'jimandfangzhuo.com-images-us-east-1';
const THUMBNAILS_BUCKET = 'jimandfangzhuo.com-thumbnails-us-east-1';

// Semaphore for concurrency control
class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];
  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return;
    }
    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.active--;
    if (this.queue.length > 0) {
      this.active++;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// Check for required tools
function checkDependencies() {
  try {
    execSync('which sips', { stdio: 'ignore' });
  } catch {
    console.error('Error: sips CLI is required (built-in on macOS).');
    process.exit(1);
  }
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
  } catch {
    console.error('Error: ffmpeg CLI is required. Please install it, e.g., \'brew install ffmpeg\'.');
    process.exit(1);
  }
  try {
    execSync('which exiftool', { stdio: 'ignore' });
  } catch {
    console.error('Error: exiftool CLI is required. Please install it, e.g., \'brew install exiftool\'.');
    process.exit(1);
  }
}

// Find files recursively, skipping hidden files/directories
function getFilesRecursively(dir: string): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file.startsWith('.')) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...getFilesRecursively(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

// Extract metadata in one batch using exiftool
interface ExifMetadata {
  SourceFile: string;
  CreateDate?: string | number;
  DateTimeOriginal?: string | number;
}

function fetchAllMetadata(albumPath: string): Promise<Map<string, ExifMetadata>> {
  return new Promise((resolve) => {
    const absolutePath = path.resolve(albumPath);
    const cmd = `exiftool -json -CreateDate -DateTimeOriginal -d %s -r "${absolutePath}"`;

    console.log('Extracting image/video metadata in batch...');
    exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout) => {
      const metadataMap = new Map<string, ExifMetadata>();
      if (err) {
        console.warn('Warning: exiftool failed to extract metadata in batch. Falling back to individual filesystem stats.', err.message);
        return resolve(metadataMap);
      }
      try {
        const list: ExifMetadata[] = JSON.parse(stdout);
        for (const item of list) {
          if (item.SourceFile) {
            metadataMap.set(path.resolve(item.SourceFile), item);
          }
        }
      } catch (e: unknown) {
        const err2 = e as Error;
        console.warn('Warning: failed to parse exiftool JSON output.', err2.message);
      }
      resolve(metadataMap);
    });
  });
}

// Helper to run shell command
function runCommand(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Content-type lookup
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.heic':
      return 'image/heic';
    case '.heif':
      return 'image/heif';
    case '.mov':
      return 'video/quicktime';
    case '.mp4':
      return 'video/mp4';
    case '.m4v':
      return 'video/x-m4v';
    case '.avi':
      return 'video/x-msvideo';
    default:
      return 'application/octet-stream';
  }
}

async function main() {
  const args = process.argv.slice(2);
  const albumPath = args[0];
  const coverImage = args[1];

  if (!albumPath || !coverImage) {
    console.error('Usage: load-album <album-path> <cover-image-filename>');
    process.exit(1);
  }

  if (!fs.existsSync(albumPath) || !fs.statSync(albumPath).isDirectory()) {
    console.error(`Error: Album path "${albumPath}" is not a valid directory.`);
    process.exit(1);
  }

  checkDependencies();

  const cleanPath = path.resolve(albumPath);
  const albumName = path.basename(cleanPath);
  const albumId = crypto.randomUUID();
  const createdAt = Math.floor(Date.now() / 1000);

  console.log(`Album Name: ${albumName}`);

  // Confirm sync
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await new Promise<string>(resolve => {
    rl.question(`Sync "${albumName}" to S3? [y/N] `, resolve);
  });
  rl.close();

  if (!/^[Yy]$/.test(confirm.trim())) {
    console.log('Aborted.');
    process.exit(0);
  }

  const allFiles = getFilesRecursively(cleanPath);

  // Filter out the video portion of Live Photos
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.gif'];
  const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi'];

  const imageBaseNames = new Set<string>();
  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
      const dir = path.dirname(file);
      const base = path.basename(file, path.extname(file));
      imageBaseNames.add(path.join(dir, base).toLowerCase());
    }
  }

  const filesToUpload = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    if (videoExtensions.includes(ext)) {
      const dir = path.dirname(file);
      const base = path.basename(file, path.extname(file));
      const baseKey = path.join(dir, base).toLowerCase();
      if (imageBaseNames.has(baseKey)) {
        console.log(`Skipping video portion of Live Photo: ${path.relative(cleanPath, file)}`);
        return false;
      }
    }
    return true;
  });

  const totalFiles = filesToUpload.length;
  console.log(`Uploading ${totalFiles} files from ${cleanPath}...`);

  // Fetch existing S3 objects to skip already-uploaded files
  console.log('Checking S3 bucket for existing files to enable resume capability...');
  const existingKeys = new Set<string>();
  let continuationToken: string | undefined = undefined;
  try {
    do {
      const listRes: ListObjectsV2CommandOutput = await s3.send(new ListObjectsV2Command({
        Bucket: IMAGES_BUCKET,
        Prefix: `${albumName}/`,
        ContinuationToken: continuationToken
      }));
      if (listRes.Contents) {
        for (const obj of listRes.Contents) {
          if (obj.Key) {
            existingKeys.add(obj.Key);
          }
        }
      }
      continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);
    console.log(`Found ${existingKeys.size} files already uploaded to S3.`);
  } catch (e: unknown) {
    const err = e as Error;
    console.warn(`Warning: Failed to fetch existing S3 objects: ${err.message}. Proceeding with clean upload.`);
  }

  // Setup temp directory for local thumbnail processing
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-album-'));

  // Register cleanup on exit
  const cleanup = () => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { process.exit(1); });
  process.on('SIGTERM', () => { process.exit(1); });

  // Fetch metadata for all files in batch
  const metadataMap = await fetchAllMetadata(cleanPath);

  // Helper to extract create date for a given file path
  const getCreateDate = (filePath: string): string => {
    const resolvedPath = path.resolve(filePath);
    const meta = metadataMap.get(resolvedPath);
    const takenAt = meta?.CreateDate || meta?.DateTimeOriginal;

    if (takenAt) {
      const cleanTaken = String(takenAt).trim();
      if (/^[0-9]+$/.test(cleanTaken)) {
        return cleanTaken;
      }
    }

    // Fallback 1: File stat mtime
    try {
      const stat = fs.statSync(resolvedPath);
      return String(Math.floor(stat.mtimeMs / 1000));
    } catch {
      // Ignore error and fall through
    }

    // Fallback 2: Current timestamp
    return String(Math.floor(Date.now() / 1000));
  };

  // Concurrency semaphores
  const cpuSemaphore = new Semaphore(4);       // Limit thumbnail generation to 4 parallel processes
  const networkSemaphore = new Semaphore(20);   // Limit uploads to 20 parallel uploads

  let completedCount = 0;

  // Process a single file
  const processFile = async (filePath: string) => {
    const relativePath = path.relative(cleanPath, filePath);
    let ext = path.extname(filePath).toLowerCase();

    const takenAt = getCreateDate(filePath);
    const isHeic = ['.heic', '.heif'].includes(ext);

    // Compute destination key early to check if already uploaded
    let uploadRelativePath = relativePath;
    if (isHeic) {
      const baseNameWithoutExt = path.basename(relativePath, path.extname(relativePath));
      const dirName = path.dirname(relativePath);
      uploadRelativePath = dirName === '.' ? `${baseNameWithoutExt}.jpg` : path.join(dirName, `${baseNameWithoutExt}.jpg`);
    }

    const destinationKey = `${takenAt}-${uploadRelativePath}`;
    const s3Key = `${albumName}/${destinationKey}`;

    if (existingKeys.has(s3Key)) {
      completedCount++;
      console.log(`(${completedCount}/${totalFiles}) Skipping (already uploaded): ${relativePath}`);
      return;
    }

    let uploadFilePath = filePath;

    if (isHeic) {
      const tempConvertedName = `${crypto.randomUUID()}.jpg`;
      const tempConvertedPath = path.join(tempDir, tempConvertedName);

      await cpuSemaphore.acquire();
      try {
        console.log(`Converting HEIC ${relativePath} to JPG...`);
        await runCommand(`sips -s format jpeg "${filePath}" --out "${tempConvertedPath}" >/dev/null 2>&1`);
      } catch (e: unknown) {
        const err = e as Error;
        console.error(`Failed to convert ${relativePath} to JPG:`, err.message);
        throw err;
      } finally {
        cpuSemaphore.release();
      }

      uploadFilePath = tempConvertedPath;
      ext = '.jpg';
    }

    const isVideo = ['.mp4', '.mov', '.m4v', '.avi'].includes(ext);
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);

    const tempThumbnail = path.join(tempDir, `${destinationKey}.jpg`);

    // 1. Generate thumbnail (CPU bound)
    let hasThumbnail = false;
    if (isImage || isVideo) {
      await cpuSemaphore.acquire();
      try {
        fs.mkdirSync(path.dirname(tempThumbnail), { recursive: true });
        if (isImage) {
          await runCommand(`sips -s format jpeg -Z 600 "${uploadFilePath}" --out "${tempThumbnail}" >/dev/null 2>&1`);
          hasThumbnail = true;
        } else if (isVideo) {
          await runCommand(`ffmpeg -y -nostdin -i "${uploadFilePath}" -ss 00:00:01 -vframes 1 -vf "scale=600:-1" "${tempThumbnail}" >/dev/null 2>&1`);
          hasThumbnail = true;
        }
      } catch (e: unknown) {
        const err = e as Error;
        console.warn(`Warning: Failed to generate thumbnail for ${relativePath}: ${err.message}`);
      } finally {
        cpuSemaphore.release();
      }
    }

    // 2. Upload to S3 (Network bound)
    await networkSemaphore.acquire();
    try {
      // Upload original (or converted JPG) using lib-storage Upload for robust retries & chunked streaming
      const originalUpload = new Upload({
        client: s3,
        params: {
          Bucket: IMAGES_BUCKET,
          Key: `${albumName}/${destinationKey}`,
          Body: fs.createReadStream(uploadFilePath),
          ContentType: getContentType(uploadFilePath)
        }
      });
      await originalUpload.done();

      // Upload thumbnail
      if (hasThumbnail && fs.existsSync(tempThumbnail)) {
        const thumbnailUpload = new Upload({
          client: s3,
          params: {
            Bucket: THUMBNAILS_BUCKET,
            Key: `${albumName}/${destinationKey}`,
            Body: fs.createReadStream(tempThumbnail),
            ContentType: 'image/jpeg'
          }
        });
        await thumbnailUpload.done();
      }

      completedCount++;
      console.log(`(${completedCount}/${totalFiles}) Uploaded ${relativePath} as ${destinationKey}`);
    } catch (e: unknown) {
      const err = e as Error;
      console.error(`Error uploading file ${relativePath}:`, err.message);
      throw err;
    } finally {
      networkSemaphore.release();
      // Clean up temp thumbnail file immediately to save disk space
      try {
        if (fs.existsSync(tempThumbnail)) {
          fs.unlinkSync(tempThumbnail);
        }
      } catch {
        // Ignore
      }
      // Clean up converted HEIC temp file
      if (isHeic) {
        try {
          if (fs.existsSync(uploadFilePath)) {
            fs.unlinkSync(uploadFilePath);
          }
        } catch {
          // Ignore
        }
      }
    }
  };

  // Run all processes concurrently
  try {
    await Promise.all(filesToUpload.map(file => processFile(file)));
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Sync failed due to errors:', err.message);
    cleanup();
    process.exit(1);
  }

  // Cover image key logic
  const coverImagePath = path.join(cleanPath, coverImage);
  let coverImageObjectKey = coverImage;

  if (fs.existsSync(coverImagePath)) {
    const coverImageTimestamp = getCreateDate(coverImagePath);
    let coverName = coverImage;
    const coverExt = path.extname(coverImage).toLowerCase();
    if (['.heic', '.heif'].includes(coverExt)) {
      const coverBase = path.basename(coverImage, path.extname(coverImage));
      coverName = `${coverBase}.jpg`;
    }
    coverImageObjectKey = `${coverImageTimestamp}-${coverName}`;
  }

  // Write metadata to DynamoDB
  console.log('Writing metadata to DynamoDB...');
  try {
    await dynamo.send(new PutItemCommand({
      TableName: 'AlbumMetadata',
      Item: {
        albumId: { S: albumId },
        albumName: { S: albumName },
        coverImageObjectKey: { S: coverImageObjectKey },
        createdAt: { N: String(createdAt) }
      }
    }));
    console.log('Successfully added entry to DynamoDB.');
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Failed to write to DynamoDB:', err.message);
    cleanup();
    process.exit(1);
  }

  cleanup();
  console.log(`Sync of "${albumName}" completed successfully!`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
