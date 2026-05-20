import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketAccessControl, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ImageS3Bucket extends Bucket {
  constructor(scope: Construct, id: string, baseName: string, bucketRegion: string, replicationRegion: string) {

    const bucketName = `${baseName}-${bucketRegion}`;
    const replicationId = `${id}-${replicationRegion}-replication`;
    const replicationBucketName = `${baseName}-${replicationRegion}`;

    super(scope, id, {
      bucketName,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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
