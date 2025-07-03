import { IDistribution } from 'aws-cdk-lib/aws-cloudfront'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'

export class UIDeployment extends BucketDeployment {
  constructor(scope: Construct, uiBucket: IBucket, distribution: IDistribution) {
    super(scope, 'PlannerFrontendDeployment', {
      sources: [Source.asset('../ui/dist')],
      destinationBucket: uiBucket,
      distribution: distribution
    })
  }
}
