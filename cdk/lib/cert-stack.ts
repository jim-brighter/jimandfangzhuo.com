import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs/lib/construct';
import { Cert } from './core/Cert';

export class CertStack extends Stack {

  readonly cert: Certificate;

  constructor(scope: Construct, id: string, hostedZone: HostedZone, props?: StackProps) {
    super(scope, id, props);

    this.cert = new Cert(this, hostedZone);
  }
}
