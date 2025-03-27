import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ddb from 'aws-cdk-lib/aws-dynamodb'
import * as nodejslambda from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cognito from 'aws-cdk-lib/aws-cognito'

const EVENT_TYPE_INDEX = 'EventsTypeIndex'

export class BackendStackWest extends Stack {
  constructor(scope: Construct, id: string,
              eventsTable: ddb.Table,
              commentsTable: ddb.Table,
              imagesTable: ddb.Table,
              christmasTable: ddb.Table,
              userPool: cognito.UserPool,
              props?: StackProps) {
    super(scope, id, props)

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })

    // IMAGE S3 BUCKET
    const imagesBucket = new s3.Bucket(this, 'PlannerImagesBucket', {
      bucketName: 'jimandfangzhuo.com-images-west',
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false
      }),
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      lifecycleRules: [{
        enabled: true,
        expiredObjectDeleteMarker: true,
        noncurrentVersionExpiration: Duration.days(30)
      }],
      replicationRules: [{
        deleteMarkerReplication: true,
        destination: s3.Bucket.fromBucketName(this, 'EastBucket', 'jimandfangzhuo.com-images'),
        priority: 1
      }]
    })

    // LAMBDAS
    const defaultErrorLambda = new lambda.Function(this, 'DefaultErrorHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
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
    })

    const eventsLambda = new nodejslambda.NodejsFunction(this, 'EventsHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: '../lambda/events-lambda/events.ts',
      bundling: {
        minify: true
      },
      environment: {
        EVENTS_TABLE: eventsTable.tableName,
        EVENT_TYPE_INDEX
      },
      logRetention: logs.RetentionDays.THREE_DAYS
    })

    const commentsLambda = new nodejslambda.NodejsFunction(this, 'CommentsHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: '../lambda/comments-lambda/comments.ts',
      bundling: {
        minify: true
      },
      environment: {
        COMMENTS_TABLE: commentsTable.tableName
      },
      logRetention: logs.RetentionDays.THREE_DAYS
    })

    const imagesLambda = new nodejslambda.NodejsFunction(this, 'ImagesHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: '../lambda/images-lambda/images.ts',
      bundling: {
        minify: true
      },
      environment: {
        IMAGES_TABLE: imagesTable.tableName,
        BUCKET_NAME: imagesBucket.bucketName
      },
      logRetention: logs.RetentionDays.THREE_DAYS,
      memorySize: 256,
      timeout: Duration.seconds(30)
    })

    const christmasLambda = new nodejslambda.NodejsFunction(this, 'ChristmasHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: '../lambda/christmas-lambda/christmas.ts',
      bundling: {
        minify: true
      },
      environment: {
        CHRISTMAS_TABLE: christmasTable.tableName
      },
      logRetention: logs.RetentionDays.THREE_DAYS
    })

    eventsTable.grantReadWriteData(eventsLambda)
    commentsTable.grantReadWriteData(commentsLambda)
    imagesTable.grantReadWriteData(imagesLambda)
    christmasTable.grantReadWriteData(christmasLambda)

    imagesBucket.grantReadWrite(imagesLambda)
    imagesBucket.grantPutAcl(imagesLambda)

    // ACM
    const cert = new certmanager.Certificate(this, 'PlannerCert', {
      domainName: 'jimandfangzhuo.com',
      subjectAlternativeNames: ['*.jimandfangzhuo.com'],
      validation: certmanager.CertificateValidation.fromDns(hostedZone)
    })

    // AUTHORIZER
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'PlannerCognitoAuthorizer'
    })

    // REST API
    const restApi = new apigw.LambdaRestApi(this, 'PlannerApi', {
      handler: defaultErrorLambda,
      proxy: false,
      domainName: {
        certificate: cert,
        domainName: 'api.jimandfangzhuo.com',
        securityPolicy: apigw.SecurityPolicy.TLS_1_2
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowHeaders: ['*'],
        allowCredentials: true
      },
      deployOptions: {
        throttlingBurstLimit: 10,
        throttlingRateLimit: 3
      }
    })

    const eventsLambdaIntegration = new apigw.LambdaIntegration(eventsLambda)
    const commentsLambdaIntegration = new apigw.LambdaIntegration(commentsLambda)
    const imagesLambdaIntegration = new apigw.LambdaIntegration(imagesLambda)
    const christmasLambdaIntegration = new apigw.LambdaIntegration(christmasLambda)

    const api = restApi.root.addResource('api')

    // API: Events
    const eventsApi = api.addResource('events')
    eventsApi.addMethod('GET', eventsLambdaIntegration, { authorizer })
    eventsApi.addMethod('POST', eventsLambdaIntegration, { authorizer })
    eventsApi.addMethod('PUT', eventsLambdaIntegration, { authorizer })
    eventsApi.addMethod('DELETE', eventsLambdaIntegration, { authorizer })

    const eventsTypeApi = eventsApi.addResource('{eventType}')
    eventsTypeApi.addMethod('GET', eventsLambdaIntegration, { authorizer })

    // API: Comments
    const commentsApi = api.addResource('comments')
    commentsApi.addMethod('GET', commentsLambdaIntegration, { authorizer })
    commentsApi.addMethod('POST', commentsLambdaIntegration, { authorizer })

    // API: Images
    const imagesApi = api.addResource('images')
    imagesApi.addMethod('GET', imagesLambdaIntegration, { authorizer })
    imagesApi.addMethod('POST', imagesLambdaIntegration, { authorizer })

    // API: Christmas
    const christmasApi = api.addResource('christmas')
    christmasApi.addMethod('GET', christmasLambdaIntegration)
    christmasApi.addMethod('POST', christmasLambdaIntegration, { authorizer })
    christmasApi.addMethod('PUT', christmasLambdaIntegration, { authorizer })
    christmasApi.addMethod('DELETE', christmasLambdaIntegration, { authorizer })

    // ROUTE53 MAPPING
    new route53.ARecord(this, 'ApiRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(restApi)),
      region: 'us-west-2'
    })
  }
}
