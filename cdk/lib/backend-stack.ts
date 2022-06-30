import { Stack, StackProps, RemovalPolicy} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as path from 'path';

export class PlannerBackend extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //Dynamo Tables

    const eventsTable = new ddb.Table(this, 'EventsTable', {
      partitionKey: {
        name: 'eventId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'PlannerEvents',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST
    });

    eventsTable.addGlobalSecondaryIndex({
      indexName: 'EventsTypeIndex',
      partitionKey: {
        name: 'eventType',
        type: ddb.AttributeType.STRING
      },
      projectionType: ddb.ProjectionType.ALL
    });

    const imagesTable = new ddb.Table(this, 'ImagesTable', {
      partitionKey: {
        name: 'imageId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'PlannerImages',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST
    });

    const commentsTable = new ddb.Table(this, 'CommentsTable', {
      partitionKey: {
        name: 'commentId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'PlannerComments',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST
    });

    //Lambdas

    const defaultErrorLambda = new lambda.Function(this, 'DefaultErrorLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        return {
          statusCode: 404,
          body: 'Not Found'
        }
      `)
    });

    const eventsLambda = new lambda.Function(this, 'EventsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'events.handler',
      code: lambda.Code.fromAsset(path.join('..', 'events-lambda')),
      environment: {},
      logRetention: logs.RetentionDays.ONE_MONTH
    });

    eventsTable.grantReadWriteData(eventsLambda);

    //REST API

    const restApi = new apigw.LambdaRestApi(this, 'PlannerApi', {
      handler: defaultErrorLambda,
      proxy: false,
      domainName: {
        certificate: certmanager.Certificate.fromCertificateArn(this, 'acmCert', 'arn:aws:acm:us-east-1:108929950724:certificate/2d2ada5b-ba72-4a06-b04b-2375ac6cccc0'),
        domainName: 'api.jimandfangzhuo.com',
        securityPolicy: apigw.SecurityPolicy.TLS_1_2
      }
    });

    const api = restApi.root.addResource('api');

    const eventsApi = api.addResource('events');
    eventsApi.addMethod('GET', new apigw.LambdaIntegration(eventsLambda));

    //Route53 Mapping

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    });

    const apiRecord = new route53.ARecord(this, 'ApiRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(restApi))
    });
  }
}
