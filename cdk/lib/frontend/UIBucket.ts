import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption, RedirectProtocol } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export class UIBucket extends Bucket {
  constructor(scope: Construct) {
    super(scope, 'PlannerFrontendRootBucket', {
      bucketName: 'jimandfangzhuo.com',
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      
      versioned: true,
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      lifecycleRules: [{
        enabled: true,
        expiredObjectDeleteMarker: true,
        noncurrentVersionExpiration: Duration.days(3)
      }]
    })
  }
}

export class UIRedirectBucket extends Bucket {
  constructor(scope: Construct) {
    super(scope, 'PlannerFrontendSubdomainBucket', {
      bucketName: 'www.jimandfangzhuo.com',
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      websiteRedirect: {
        hostName: 'jimandfangzhuo.com',
        protocol: RedirectProtocol.HTTPS
      }
    })
  }
}
