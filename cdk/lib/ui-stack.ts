import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs/lib/construct';
import { UIRootRecord } from './core/Route53';
import { UIBucket } from './frontend/UIBucket';
import { UIDeployment } from './frontend/UIDeployment';
import { UIDistribution } from './frontend/UIDistribution';

export class UIStack extends Stack {
  constructor(scope: Construct, id: string, hostedZone: HostedZone, cert: Certificate, props?: StackProps) {
    super(scope, id, props);

    const frontendBucket = new UIBucket(this);
    const distribution = new UIDistribution(this, frontendBucket, cert);

    new UIDeployment(this, frontendBucket, distribution);
    new UIRootRecord(this, hostedZone, distribution);
  }
}
