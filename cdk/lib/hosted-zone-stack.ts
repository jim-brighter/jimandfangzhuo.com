import { Stack, StackProps } from 'aws-cdk-lib'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

export class HostedZoneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    new HostedZone(this, 'PlannerHostedZone', {
      zoneName: 'jimandfangzhuo.com'
    })
  }
}
