import { Duration } from 'aws-cdk-lib'
import { CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { IUserPool, OAuthScope, UserPool, UserPoolClientIdentityProvider, UserPoolDomain } from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

export class CognitoUserPool extends UserPool {
  constructor(scope: Construct) {
    super(scope, 'UserPool', {
      userPoolName: 'PlannerUserPool',
      passwordPolicy: {
        requireDigits: false,
        requireUppercase: false,
        requireSymbols: false
      }
    })
  }

  setupUIClient() {
    this.addClient('PlannerFrontend', {
      userPoolClientName: 'planner-frontend',
      accessTokenValidity: Duration.minutes(60 * 6),
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [OAuthScope.OPENID],
        callbackUrls: ['https://jimandfangzhuo.com/details/to-do'],
        logoutUrls: ['https://jimandfangzhuo.com']
      }
    })
  }

  setupDomain(cert: ICertificate): UserPoolDomain {
    return this.addDomain('PlannerCognitoDomain', {
      customDomain: {
        domainName: 'user.jimandfangzhuo.com',
        certificate: cert
      }
    })
  }

}

export function setupAuthorizer(scope: Construct, userPool: IUserPool): CognitoUserPoolsAuthorizer {
  return new CognitoUserPoolsAuthorizer(scope, 'CognitoAuthorizer', {
    cognitoUserPools: [userPool],
    identitySource: 'PlannerCognitoAuthorizer'
  })
}
