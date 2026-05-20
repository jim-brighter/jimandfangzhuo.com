import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs/lib/construct';
import { Region } from './constants';
import { ImageS3Bucket } from './backend/ImageS3Bucket';

export class S3BucketStack extends Stack {

  readonly bucket: ImageS3Bucket;
  readonly thumbnailBucket: ImageS3Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucketRegion = props?.env?.region || Region.US_EAST_1;
    const replicationRegion = bucketRegion === Region.US_EAST_1 ? Region.AP_NORTHEAST_2 : Region.US_EAST_1;

    this.bucket = new ImageS3Bucket(
      this,
      'JimAndFangzhuoImagesBucket',
      'jimandfangzhuo.com-images',
      bucketRegion,
      replicationRegion
    );

    this.thumbnailBucket = new ImageS3Bucket(
      this,
      'JimAndFangzhuoThumbnailsBucket',
      'jimandfangzhuo.com-thumbnails',
      bucketRegion,
      replicationRegion
    );
  }
}
