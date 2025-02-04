import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager'

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // S3 SITE
    const frontendRootBucket = new s3.Bucket(this, 'PlannerFrontendRootBucket', {
      bucketName: 'jimandfangzhuo.com',
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      lifecycleRules: [{
        enabled: true,
        expiredObjectDeleteMarker: true,
        noncurrentVersionExpiration: Duration.days(3)
      }]
    })

    const frontendSubdomainBucket = new s3.Bucket(this, 'PlannerFrontendSubdomainBucket', {
      bucketName: 'www.jimandfangzhuo.com',
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      websiteRedirect: {
        hostName: 'jimandfangzhuo.com',
        protocol: s3.RedirectProtocol.HTTPS
      }
    })

    // CLOUDFRONT DISTRIBUTION
    const distribution = new cloudfront.Distribution(this, 'PlannerDistribution', {
      defaultBehavior: {
        compress: true,
        origin: new origins.S3StaticWebsiteOrigin(frontendRootBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: new cloudfront.CachePolicy(this, 'CachePolicy', {
          defaultTtl: Duration.days(90),
          minTtl: Duration.days(30),
          maxTtl: Duration.days(365)
        })
      },
      certificate: certmanager.Certificate.fromCertificateArn(this, 'PlannerCert', 'arn:aws:acm:us-east-1:108929950724:certificate/f312d8ad-09ce-440a-807c-a4bc46cb0dd0'),
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      domainNames: ['jimandfangzhuo.com'],
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/',
          responseHttpStatus: 200,
          ttl: Duration.days(30)
        },
        {
          httpStatus: 403,
          responsePagePath: '/',
          responseHttpStatus: 200,
          ttl: Duration.days(30)
        }
      ]
    })

    // S3 Deployment
    new s3deployment.BucketDeployment(this, 'PlannerFrontendDeployment', {
      sources: [s3deployment.Source.asset('../ui/dist')],
      destinationBucket: frontendRootBucket,
      distribution: distribution
    })

    // ROUTE53 MAPPING
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })

    const rootARecord = new route53.ARecord(this, 'PlannerRootRecord', {
      zone: hostedZone,
      target: {
        aliasTarget: new targets.CloudFrontTarget(distribution)
      }
    })

    const subdomainARecord = new route53.ARecord(this, 'PlannerSubdomainRecord', {
      zone: hostedZone,
      recordName: 'www',
      target: {
        aliasTarget: new targets.BucketWebsiteTarget(frontendSubdomainBucket)
      }
    })
  }
}
