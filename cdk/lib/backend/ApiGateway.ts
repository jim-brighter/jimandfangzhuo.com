import { CognitoUserPoolsAuthorizer, EndpointType, LambdaIntegration, LambdaRestApi, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class ApiGateway extends LambdaRestApi {

  private authorizer: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, defaultErrorLambda: IFunction, cert: ICertificate, authorizer: CognitoUserPoolsAuthorizer) {
    super(scope, 'JimAndFangzhuoApi', {
      handler: defaultErrorLambda,
      proxy: false,
      endpointTypes: [EndpointType.REGIONAL],
      domainName: {
        certificate: cert,
        domainName: 'api.jimandfangzhuo.com',
        securityPolicy: SecurityPolicy.TLS_1_2
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowHeaders: ['*'],
        allowCredentials: true
      },
      deployOptions: {
        throttlingBurstLimit: 3,
        throttlingRateLimit: 5
      }
    });

    this.authorizer = authorizer;

    this.root.addResource('api');
  }

  setupImagesApi(handler: IFunction) {
    const imagesLambdaIntegration = new LambdaIntegration(handler);
    const api = this.root.getResource('api');

    const imagesApi = api?.addResource('images');
    imagesApi?.addMethod('GET', imagesLambdaIntegration, { authorizer: this.authorizer });
  }
}
