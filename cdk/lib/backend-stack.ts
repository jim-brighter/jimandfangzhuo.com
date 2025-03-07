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
import * as backup from 'aws-cdk-lib/aws-backup'

const EVENT_TYPE_INDEX = 'EventsTypeIndex'

export class BackendStack extends Stack {

  readonly eventsTable: ddb.Table
  readonly commentsTable: ddb.Table
  readonly imagesTable: ddb.Table
  readonly christmasTable: ddb.Table
  readonly userPool: cognito.UserPool
  readonly cert: certmanager.Certificate

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })

    // DYNAMO TABLES
    this.eventsTable = new ddb.Table(this, 'EventsTable', {
      partitionKey: {
        name: 'eventId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'PlannerEvents',
      removalPolicy: RemovalPolicy.RETAIN,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: true,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
        recoveryPeriodInDays: 14
      },
      replicationRegions: ['us-west-2']
    })

    this.eventsTable.addGlobalSecondaryIndex({
      indexName: EVENT_TYPE_INDEX,
      partitionKey: {
        name: 'eventType',
        type: ddb.AttributeType.STRING
      },
      projectionType: ddb.ProjectionType.ALL
    })

    this.imagesTable = new ddb.Table(this, 'ImagesTable', {
      partitionKey: {
        name: 'imageId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'PlannerImages',
      removalPolicy: RemovalPolicy.RETAIN,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: true,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
        recoveryPeriodInDays: 14
      },
      replicationRegions: ['us-west-2']
    })

    this.commentsTable = new ddb.Table(this, 'CommentsTable', {
      partitionKey: {
        name: 'commentId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'PlannerComments',
      removalPolicy: RemovalPolicy.RETAIN,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: true,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
        recoveryPeriodInDays: 14
      },
      replicationRegions: ['us-west-2']
    })

    this.christmasTable = new ddb.Table(this, 'ChristmasTable', {
      partitionKey: {
        name: 'itemId',
        type: ddb.AttributeType.STRING
      },
      encryption: ddb.TableEncryption.AWS_MANAGED,
      tableName: 'PlannerChristmas',
      removalPolicy: RemovalPolicy.RETAIN,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: true,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
        recoveryPeriodInDays: 14
      },
      replicationRegions: ['us-west-2']
    })

    const plan = backup.BackupPlan.daily35DayRetention(this, 'BackupPlan')
    plan.addSelection('BackupSelection', {
      resources: [
        backup.BackupResource.fromDynamoDbTable(this.eventsTable),
        backup.BackupResource.fromDynamoDbTable(this.imagesTable),
        backup.BackupResource.fromDynamoDbTable(this.commentsTable),
        backup.BackupResource.fromDynamoDbTable(this.christmasTable)
      ]
    })

    // IMAGE S3 BUCKET
    const imagesBucket = new s3.Bucket(this, 'PlannerImagesBucket', {
      bucketName: 'jimandfangzhuo.com-images',
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
        destination: s3.Bucket.fromBucketName(this, 'WestBucket', 'jimandfangzhuo.com-images-west'),
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
        EVENTS_TABLE: this.eventsTable.tableName,
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
        COMMENTS_TABLE: this.commentsTable.tableName
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
        IMAGES_TABLE: this.imagesTable.tableName,
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
        CHRISTMAS_TABLE: this.christmasTable.tableName
      },
      logRetention: logs.RetentionDays.THREE_DAYS
    })

    this.eventsTable.grantReadWriteData(eventsLambda)
    this.commentsTable.grantReadWriteData(commentsLambda)
    this.imagesTable.grantReadWriteData(imagesLambda)
    this.christmasTable.grantReadWriteData(christmasLambda)

    imagesBucket.grantReadWrite(imagesLambda)
    imagesBucket.grantPutAcl(imagesLambda)

    // ACM
    this.cert = new certmanager.Certificate(this, 'PlannerCert', {
      domainName: 'jimandfangzhuo.com',
      subjectAlternativeNames: ['*.jimandfangzhuo.com'],
      validation: certmanager.CertificateValidation.fromDns(hostedZone)
    })

    // COGNITO
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'PlannerUserPool',
      passwordPolicy: {
        requireDigits: false,
        requireUppercase: false,
        requireSymbols: false
      }
    })

    const client = this.userPool.addClient('PlannerFrontend', {
      userPoolClientName: 'planner-frontend',
      accessTokenValidity: Duration.minutes(60 * 6),
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [cognito.OAuthScope.OPENID],
        callbackUrls: ['https://jimandfangzhuo.com/details/to-do'],
        logoutUrls: ['https://jimandfangzhuo.com']
      }
    })

    const cognitoDomain = this.userPool.addDomain('PlannerCognitoDomain', {
      customDomain: {
        domainName: 'user.jimandfangzhuo.com',
        certificate: this.cert
      }
    })

    // AUTHORIZER
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [this.userPool],
      authorizerName: 'PlannerCognitoAuthorizer'
    })

    // REST API
    const restApi = new apigw.LambdaRestApi(this, 'PlannerApi', {
      handler: defaultErrorLambda,
      proxy: false,
      domainName: {
        certificate: this.cert,
        domainName: 'api.jimandfangzhuo.com',
        securityPolicy: apigw.SecurityPolicy.TLS_1_2
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowHeaders: ['*'],
        allowCredentials: true
      }
    })

    restApi.addUsagePlan('UsagePlan', {
      throttle: {
        rateLimit: 3,
        burstLimit: 3
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
    const apiRecord = new route53.ARecord(this, 'ApiRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(restApi)),
      region: 'us-east-1'
    })

    const userRecord = new route53.ARecord(this, 'CognitoRecord', {
      zone: hostedZone,
      recordName: 'user',
      target: route53.RecordTarget.fromAlias(new targets.UserPoolDomainTarget(cognitoDomain))
    })
  }
}
