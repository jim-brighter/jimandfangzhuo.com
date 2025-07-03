import { Duration } from 'aws-cdk-lib'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { AllowedMethods, CachePolicy, CachedMethods, Distribution, SSLMethod, SecurityPolicyProtocol, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront'
import { S3StaticWebsiteOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export class UIDistribution extends Distribution {
  constructor(scope: Construct, uiBucket: IBucket, cert: ICertificate) {
    super(scope, 'PlannerDistribution', {
      defaultBehavior: {
        compress: true,
        origin: new S3StaticWebsiteOrigin(uiBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: new CachePolicy(scope, 'CachePolicy', {
          defaultTtl: Duration.days(90),
          minTtl: Duration.days(30),
          maxTtl: Duration.days(365)
        })
      },
      certificate: cert,
      sslSupportMethod: SSLMethod.SNI,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
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
  }
}
