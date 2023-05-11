import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // S3 SITE

    const frontendRootBucket = new s3.Bucket(this, 'PlannerFrontendRootBucket', {
      bucketName: 'jimandfangzhuo.com',
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      lifecycleRules: [{
        enabled: true,
        expiredObjectDeleteMarker: true,
        noncurrentVersionExpiration: Duration.days(30),
        noncurrentVersionsToRetain: 1
      }]
    });

    const frontendSubdomainBucket = new s3.Bucket(this, 'PlannerFrontendSubdomainBucket', {
      bucketName: 'www.jimandfangzhuo.com',
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      websiteRedirect: {
        hostName: 'jimandfangzhuo.com',
        protocol: s3.RedirectProtocol.HTTPS
      }
    });

    // CLOUDFRONT DISTRIBUTION
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'PlannerDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: frontendRootBucket
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              pathPattern: '*',
              compress: true,
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
              defaultTtl: Duration.days(1),
              minTtl: Duration.days(1),
              maxTtl: Duration.days(3)
            }
          ]
        }
      ],
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      defaultRootObject: 'index.html',
      errorConfigurations: [
        {
          errorCode: 404,
          responsePagePath: '/',
          responseCode: 200,
          errorCachingMinTtl: Duration.days(1).toSeconds()
        },
        {
          errorCode: 403,
          responsePagePath: '/',
          responseCode: 200,
          errorCachingMinTtl: Duration.days(1).toSeconds()
        }
      ],
      viewerCertificate: {
        aliases: ['jimandfangzhuo.com'],
        props: {
          minimumProtocolVersion: 'TLSv1.2_2021',
          sslSupportMethod: 'sni-only',
          acmCertificateArn: 'arn:aws:acm:us-east-1:108929950724:certificate/f312d8ad-09ce-440a-807c-a4bc46cb0dd0'
        }
      }
    });

    // S3 Deployment
    new s3deployment.BucketDeployment(this, 'PlannerFrontendDeployment', {
      sources: [s3deployment.Source.asset('../ui/dist')],
      destinationBucket: frontendRootBucket,
      distribution: distribution
    });

    // ROUTE53 MAPPING

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    });

    const rootARecord = new route53.ARecord(this, 'PlannerRootRecord', {
      zone: hostedZone,
      target: {
        aliasTarget: new targets.CloudFrontTarget(distribution)
      }
    });

    const subdomainARecord = new route53.ARecord(this, 'PlannerSubdomainRecord', {
      zone: hostedZone,
      recordName: 'www',
      target: {
        aliasTarget: new targets.BucketWebsiteTarget(frontendSubdomainBucket)
      }
    });
  }
}
