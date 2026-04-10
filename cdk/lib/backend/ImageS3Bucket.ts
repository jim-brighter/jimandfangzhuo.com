import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketAccessControl, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ImageS3Bucket extends Bucket {
  constructor(scope: Construct, bucketRegion: string, replicationRegion: string) {

    const bucketName = `jimandfangzhuo.com-images-${bucketRegion}`;
    const replicationId = `${replicationRegion}-replication`;
    const replicationBucketName = `jimandfangzhuo.com-images-${replicationRegion}`;

    super(scope, 'JimAndFangzhuoImagesBucket', {
      bucketName,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      lifecycleRules: [{
        enabled: true,
        expiredObjectDeleteMarker: true,
        noncurrentVersionExpiration: Duration.days(30)
      }],
      // replicationRules: [{
      //   deleteMarkerReplication: true,
      //   destination: Bucket.fromBucketName(scope, replicationId, replicationBucketName),
      //   priority: 1
      // }]
    });
  }
}
