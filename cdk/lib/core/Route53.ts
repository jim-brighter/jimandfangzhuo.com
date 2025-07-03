import { RestApiBase } from 'aws-cdk-lib/aws-apigateway'
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront'
import { UserPoolDomain } from 'aws-cdk-lib/aws-cognito'
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { ApiGateway, BucketWebsiteTarget, CloudFrontTarget, UserPoolDomainTarget } from 'aws-cdk-lib/aws-route53-targets'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export class UIRootRecord extends ARecord {
  constructor(scope: Construct, zone: IHostedZone, distribution: IDistribution) {
    super(scope, 'PlannerRootRecord', {
      zone,
      target: {
        aliasTarget: new CloudFrontTarget(distribution)
      }
    })
  }
}

export class UISubdomainRecord extends ARecord {
  constructor(scope: Construct, zone: IHostedZone, bucket: IBucket) {
    super(scope, 'PlannerSubdomainRecord', {
      zone,
      recordName: 'www',
      target: {
        aliasTarget: new BucketWebsiteTarget(bucket)
      }
    })
  }
}

export class ApiRecord extends ARecord {
  constructor(scope: Construct, id: string, zone: IHostedZone, apiGateway: RestApiBase, region: string) {
    super(scope, id, {
      zone,
      recordName: 'api',
      target: RecordTarget.fromAlias(new ApiGateway(apiGateway)),
      region
    })
  }
}

export class UserRecord extends ARecord {
  constructor(scope: Construct, zone: IHostedZone, userPoolDomain: UserPoolDomain) {
    super(scope, 'CognitoRecord', {
      zone,
      recordName: 'user',
      target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPoolDomain))
    })
  }
}
