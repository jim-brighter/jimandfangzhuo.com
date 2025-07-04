import { Stack, StackProps } from 'aws-cdk-lib'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { ApiGateway } from './backend/ApiGateway'
import { CognitoUserPool, setupAuthorizer } from './backend/Cognito'
import { DynamoTable, setupBackupPlan } from './backend/DynamoDB'
import { ImageS3Bucket } from './backend/ImageS3Bucket'
import { DefaultErrorLambda, NodeLambda } from './backend/Lambda'
import { EVENT_TYPE_INDEX } from './constants'
import { Cert } from './core/Cert'
import { ApiRecord, UserRecord } from './core/Route53'
import { LambdaFunctions } from './types'

export class BackendStack extends Stack {

  eventsTable: DynamoTable
  commentsTable: DynamoTable
  imagesTable: DynamoTable
  christmasTable: DynamoTable
  userPool: CognitoUserPool
  cert: Certificate

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })

    this.setupDynamoTables()
    setupBackupPlan(this, [
      this.eventsTable,
      this.commentsTable,
      this.imagesTable,
      this.christmasTable
    ])

    const imagesBucket = new ImageS3Bucket(this, 'east')

    const lambdas = this.setupLambdas(imagesBucket)

    this.grantTableAndBucketPermissions(imagesBucket, lambdas)

    this.cert = new Cert(this, hostedZone)

    this.userPool = new CognitoUserPool(this)
    this.userPool.setupUIClient()
    const cognitoDomain = this.userPool.setupDomain(this.cert)
    const authorizer = setupAuthorizer(this, this.userPool)

    const restApi = new ApiGateway(this, lambdas.defaultErrorLambda, this.cert, authorizer)
    this.setupApiMethods(restApi, lambdas)

    new ApiRecord(this, 'ApiRecord', hostedZone, restApi, 'us-east-1')
    new UserRecord(this, hostedZone, cognitoDomain)
  }

  private setupDynamoTables() {
    this.eventsTable = new DynamoTable(this, 'EventsTable', 'eventId', 'PlannerEvents')
    this.imagesTable = new DynamoTable(this, 'ImagesTable', 'imageId', 'PlannerImages')
    this.commentsTable = new DynamoTable(this, 'CommentsTable', 'commentId', 'PlannerComments')
    this.christmasTable = new DynamoTable(this, 'ChristmasTable', 'itemId', 'PlannerChristmas')
    this.eventsTable.setupGSI(EVENT_TYPE_INDEX, 'eventType')
  }

  private setupLambdas(imagesBucket: ImageS3Bucket): LambdaFunctions {
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
    return { defaultErrorLambda, eventsLambda, commentsLambda, imagesLambda, christmasLambda }
  }

  private grantTableAndBucketPermissions(imagesBucket: ImageS3Bucket, lambdas: LambdaFunctions) {
    this.eventsTable.grantReadWriteData(lambdas.eventsLambda)
    this.commentsTable.grantReadWriteData(lambdas.commentsLambda)
    this.imagesTable.grantReadWriteData(lambdas.imagesLambda)
    this.christmasTable.grantReadWriteData(lambdas.christmasLambda)

    imagesBucket.grantReadWrite(lambdas.imagesLambda)
    imagesBucket.grantPutAcl(lambdas.imagesLambda)
  }

  private setupApiMethods(restApi: ApiGateway, lambdas: LambdaFunctions) {
    restApi.setupEventsApi(lambdas.eventsLambda)
    restApi.setupCommentsApi(lambdas.commentsLambda)
    restApi.setupImagesApi(lambdas.imagesLambda)
    restApi.setupChristmasApi(lambdas.christmasLambda)
  }
}
