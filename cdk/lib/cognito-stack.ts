import { CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs/lib/construct';
import { CognitoUserPool, setupAuthorizer } from './backend/Cognito';
import { UserRecord } from './core/Route53';

export class CognitoStack extends Stack {

  readonly userPool: CognitoUserPool;

  constructor(scope: Construct, id: string, hostedZone: HostedZone, cert: Certificate, props?: StackProps) {
    super(scope, id, props);

    this.userPool = new CognitoUserPool(this);
    this.userPool.setupUIClient();

    const userPoolDomain = this.userPool.setupDomain(cert);
    new UserRecord(this, hostedZone, userPoolDomain);
  }
}
