import { RemovalPolicy, Duration } from 'aws-cdk-lib'
import { BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export class ImageS3Bucket extends Bucket {
  constructor(scope: Construct, region: 'east' | 'west') {

    const isEast = region === 'east'
    const bucketName = `jimandfangzhuo.com-images${isEast ? '' : '-west'}`
    const replicationId = isEast ? 'WestBucket' : 'EastBucket'
    const replicationBucketName = `jimandfangzhuo.com-images${isEast ? '-west' : ''}`

    super(scope, 'PlannerImagesBucket', {
      bucketName,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false
      }),
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      lifecycleRules: [{
        enabled: true,
        expiredObjectDeleteMarker: true,
        noncurrentVersionExpiration: Duration.days(30)
      }],
      replicationRules: [{
        deleteMarkerReplication: true,
        destination: Bucket.fromBucketName(scope, replicationId, replicationBucketName),
        priority: 1
      }]
    })
  }
}
