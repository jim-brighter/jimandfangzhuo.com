import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as route53 from 'aws-cdk-lib/aws-route53'

export class HostedZoneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    new route53.HostedZone(this, 'PlannerHostedZone', {
      zoneName: 'jimandfangzhuo.com'
    })
  }
}
