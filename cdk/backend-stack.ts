import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejslambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';

const EVENT_TYPE_INDEX = 'EventsTypeIndex';

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DYNAMO TABLES
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
      indexName: EVENT_TYPE_INDEX,
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

    // IMAGE S3 BUCKET

    const imagesBucket = new s3.Bucket(this, 'PlannerImagesBucket', {
      bucketName: 'jimandfangzhuo.com-images',
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true
    });

    // LAMBDAS
    const defaultErrorLambda = new lambda.Function(this, 'DefaultErrorHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 404,
            body: JSON.stringify({
              errorMessage: 'Not Found'
            })
          }
        }
      `)
    });

    const eventsLambda = new nodejslambda.NodejsFunction(this, 'EventsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: './lambda-src/events-lambda/events.ts',
      bundling: {
        minify: true,
        externalModules: [
          'aws-sdk'
        ]
      },
      environment: {
        EVENTS_TABLE: eventsTable.tableName,
        EVENT_TYPE_INDEX
      },
      logRetention: logs.RetentionDays.ONE_MONTH
    });

    const commentsLambda = new nodejslambda.NodejsFunction(this, 'CommentsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: './lambda-src/comments-lambda/comments.ts',
      bundling: {
        minify: true,
        externalModules: [
          'aws-sdk'
        ]
      },
      environment: {
        COMMENTS_TABLE: commentsTable.tableName
      },
      logRetention: logs.RetentionDays.ONE_MONTH
    });

    eventsTable.grantReadWriteData(eventsLambda);

    commentsTable.grantReadWriteData(commentsLambda);

    // REST API
    const restApi = new apigw.LambdaRestApi(this, 'PlannerApi', {
      handler: defaultErrorLambda,
      proxy: false,
      domainName: {
        certificate: certmanager.Certificate.fromCertificateArn(this, 'AcmCert', 'arn:aws:acm:us-east-1:108929950724:certificate/f312d8ad-09ce-440a-807c-a4bc46cb0dd0'),
        domainName: 'api.jimandfangzhuo.com',
        securityPolicy: apigw.SecurityPolicy.TLS_1_2
      }
    });

    const eventsLambdaIntegration = new apigw.LambdaIntegration(eventsLambda);
    const commentsLambdaIntegration = new apigw.LambdaIntegration(commentsLambda);

    const api = restApi.root.addResource('api');

    const eventsApi = api.addResource('events');
    eventsApi.addCorsPreflight({
      allowOrigins: ['*'],
      allowHeaders: ['*']
    });
    eventsApi.addMethod('GET', eventsLambdaIntegration);
    eventsApi.addMethod('POST', eventsLambdaIntegration);
    eventsApi.addMethod('PUT', eventsLambdaIntegration);
    eventsApi.addMethod('DELETE', eventsLambdaIntegration);

    const eventsTypeApi = eventsApi.addResource('{eventType}');
    eventsTypeApi.addCorsPreflight({
      allowOrigins: ['*'],
      allowHeaders: ['*']
    });
    eventsTypeApi.addMethod('GET', eventsLambdaIntegration);

    const commentsApi = api.addResource('comments');
    commentsApi.addCorsPreflight({
      allowOrigins: ['*'],
      allowHeaders: ['*']
    });
    commentsApi.addMethod('GET', commentsLambdaIntegration);
    commentsApi.addMethod('POST', commentsLambdaIntegration);

    // ROUTE53 MAPPING
    const apiRecord = new route53.ARecord(this, 'ApiRecord', {
      zone: route53.HostedZone.fromLookup(this, 'HostedZone', { domainName: 'jimandfangzhuo.com' }),
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(restApi))
    });
  }
}
