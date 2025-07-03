import { Stack, StackProps } from 'aws-cdk-lib'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { UIRootRecord, UISubdomainRecord } from './core/Route53'
import { UIBucket, UIRedirectBucket } from './frontend/UIBucket'
import { UIDeployment } from './frontend/UIDeployment'
import { UIDistribution } from './frontend/UIDistribution'
import { Cert } from './core/Cert'

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, cert: Cert, props?: StackProps) {
    super(scope, id, props)

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })

    const frontendRootBucket = new UIBucket(this)
    const frontendSubdomainBucket = new UIRedirectBucket(this)
    const distribution = new UIDistribution(this, frontendRootBucket, cert)

    new UIDeployment(this, frontendRootBucket, distribution)
    new UIRootRecord(this, hostedZone, distribution)
    new UISubdomainRecord(this, hostedZone, frontendSubdomainBucket)
  }
}
