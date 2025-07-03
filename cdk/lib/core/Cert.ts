import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

export class Cert extends Certificate {
  constructor(scope: Construct, hostedZone: IHostedZone) {
    super(scope, 'PlannerCert', {
      domainName: 'jimandfangzhuo.com',
      subjectAlternativeNames: ['*.jimandfangzhuo.com'],
      validation: CertificateValidation.fromDns(hostedZone)
    })
  }
}
