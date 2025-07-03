import { Stack, StackProps } from 'aws-cdk-lib'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { ApiGateway } from './backend/ApiGateway'
import { CognitoUserPool } from './backend/Cognito'
import { DynamoTable, setupBackupPlan } from './backend/DynamoDB'
import { ImageS3Bucket } from './backend/ImageS3Bucket'
import { DefaultErrorLambda, NodeLambda } from './backend/Lambda'
import { Cert } from './core/Cert'
import { ApiRecord, UserRecord } from './core/Route53'

const EVENT_TYPE_INDEX = 'EventsTypeIndex'

export class BackendStack extends Stack {

  readonly eventsTable: DynamoTable
  readonly commentsTable: DynamoTable
  readonly imagesTable: DynamoTable
  readonly christmasTable: DynamoTable
  readonly userPool: CognitoUserPool
  readonly cert: Certificate

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })

    // DYNAMO TABLES
    this.eventsTable = new DynamoTable(this, 'EventsTable', 'eventId', 'PlannerEvents')
    this.imagesTable = new DynamoTable(this, 'ImagesTable', 'imageId', 'PlannerImages')
    this.commentsTable = new DynamoTable(this, 'CommentsTable', 'commentId', 'PlannerComments')
    this.christmasTable = new DynamoTable(this, 'ChristmasTable', 'itemId', 'PlannerChristmas')

    this.eventsTable.setupGSI(EVENT_TYPE_INDEX, 'eventType')

    setupBackupPlan(this, [
      this.eventsTable,
      this.commentsTable,
      this.imagesTable,
      this.christmasTable
    ])

    // IMAGE S3 BUCKET
    const imagesBucket = new ImageS3Bucket(this, 'east')

    // LAMBDAS
    const defaultErrorLambda = new DefaultErrorLambda(this)
    const eventsLambda = new NodeLambda(this, 'EventsHandler', '../lambda/events-lambda/events.ts', {
      EVENTS_TABLE: this.eventsTable.tableName,
      EVENT_TYPE_INDEX
    })
    const commentsLambda = new NodeLambda(this, 'CommentsHandler', '../lambda/comments-lambda/comments.ts', {
      COMMENTS_TABLE: this.commentsTable.tableName
    })
    const imagesLambda = new NodeLambda(this, 'ImagesHandler', '../lambda/images-lambda/images.ts', {
      IMAGES_TABLE: this.imagesTable.tableName,
      BUCKET_NAME: imagesBucket.bucketName
    })
    const christmasLambda = new NodeLambda(this, 'ChristmasHandler', '../lambda/christmas-lambda/christmas.ts', {
      CHRISTMAS_TABLE: this.christmasTable.tableName
    })

    this.eventsTable.grantReadWriteData(eventsLambda)
    this.commentsTable.grantReadWriteData(commentsLambda)
    this.imagesTable.grantReadWriteData(imagesLambda)
    this.christmasTable.grantReadWriteData(christmasLambda)

    imagesBucket.grantReadWrite(imagesLambda)
    imagesBucket.grantPutAcl(imagesLambda)

    // ACM
    this.cert = new Cert(this, hostedZone)

    // COGNITO
    this.userPool = new CognitoUserPool(this)
    this.userPool.setupUIClient()
    const cognitoDomain = this.userPool.setupDomain(this.cert)
    const authorizer = this.userPool.setupAuthorizer()

    // REST API
    const restApi = new ApiGateway(this, defaultErrorLambda, this.cert, authorizer)
    restApi.setupEventsApi(eventsLambda)
    restApi.setupCommentsApi(commentsLambda)
    restApi.setupImagesApi(imagesLambda)
    restApi.setupChristmasApi(christmasLambda)

    // ROUTE53 MAPPING
    new ApiRecord(this, 'ApiRecord', hostedZone, restApi, 'us-east-1')
    new UserRecord(this, hostedZone, cognitoDomain)
  }
}
