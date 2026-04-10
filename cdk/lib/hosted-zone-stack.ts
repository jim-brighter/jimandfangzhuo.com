import { Stack, StackProps } from 'aws-cdk-lib';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class HostedZoneStack extends Stack {

  readonly zone: HostedZone;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.zone = new HostedZone(this, 'JimAndFangzhuoHostedZone', {
      zoneName: 'jimandfangzhuo.com'
    });
  }
}
