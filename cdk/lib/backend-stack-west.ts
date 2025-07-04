import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ApiGateway } from './backend/ApiGateway'
import { CognitoUserPool, setupAuthorizer } from './backend/Cognito'
import { DynamoTable } from './backend/DynamoDB'
import { ImageS3Bucket } from './backend/ImageS3Bucket'
import { DefaultErrorLambda, NodeLambda } from './backend/Lambda'
import { Cert } from './core/Cert'
import { ApiRecord } from './core/Route53'
import { HostedZone } from 'aws-cdk-lib/aws-route53'

const EVENT_TYPE_INDEX = 'EventsTypeIndex'

export class BackendStackWest extends Stack {
  constructor(
    scope: Construct,
    id: string,
    eventsTable: DynamoTable,
    commentsTable: DynamoTable,
    imagesTable: DynamoTable,
    christmasTable: DynamoTable,
    userPool: CognitoUserPool,
    props?: StackProps
  ) {
    super(scope, id, props)

    const hostedZone = this.setupHostedZone()

    const imagesBucket = new ImageS3Bucket(this, 'west')

    const lambdas = this.setupLambdas(eventsTable, commentsTable, imagesTable, christmasTable, imagesBucket)

    this.grantTableAndBucketPermissions(eventsTable, commentsTable, imagesTable, christmasTable, imagesBucket, lambdas)

    const cert = new Cert(this, hostedZone)

    const authorizer = setupAuthorizer(this, userPool)

    const restApi = new ApiGateway(this, lambdas.defaultErrorLambda, cert, authorizer)
    this.setupApiMethods(restApi, lambdas)

    new ApiRecord(this, 'ApiRecord', hostedZone, restApi, 'us-west-2')
  }

  private setupHostedZone() {
    return HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })
  }

  private setupLambdas(
    eventsTable: DynamoTable,
    commentsTable: DynamoTable,
    imagesTable: DynamoTable,
    christmasTable: DynamoTable,
    imagesBucket: ImageS3Bucket
  ) {
    const defaultErrorLambda = new DefaultErrorLambda(this)
    const eventsLambda = new NodeLambda(this, 'EventsHandler', '../lambda/events-lambda/events.ts', {
      EVENTS_TABLE: eventsTable.tableName,
      EVENT_TYPE_INDEX
    })
    const commentsLambda = new NodeLambda(this, 'CommentsHandler', '../lambda/comments-lambda/comments.ts', {
      COMMENTS_TABLE: commentsTable.tableName
    })
    const imagesLambda = new NodeLambda(this, 'ImagesHandler', '../lambda/images-lambda/images.ts', {
      IMAGES_TABLE: imagesTable.tableName,
      BUCKET_NAME: imagesBucket.bucketName
    })
    const christmasLambda = new NodeLambda(this, 'ChristmasHandler', '../lambda/christmas-lambda/christmas.ts', {
      CHRISTMAS_TABLE: christmasTable.tableName
    })
    return { defaultErrorLambda, eventsLambda, commentsLambda, imagesLambda, christmasLambda }
  }

  private grantTableAndBucketPermissions(
    eventsTable: DynamoTable,
    commentsTable: DynamoTable,
    imagesTable: DynamoTable,
    christmasTable: DynamoTable,
    imagesBucket: ImageS3Bucket,
    lambdas: any
  ) {
    eventsTable.grantReadWriteData(lambdas.eventsLambda)
    commentsTable.grantReadWriteData(lambdas.commentsLambda)
    imagesTable.grantReadWriteData(lambdas.imagesLambda)
    christmasTable.grantReadWriteData(lambdas.christmasLambda)

    imagesBucket.grantReadWrite(lambdas.imagesLambda)
    imagesBucket.grantPutAcl(lambdas.imagesLambda)
  }

  private setupApiMethods(restApi: ApiGateway, lambdas: any) {
    restApi.setupEventsApi(lambdas.eventsLambda)
    restApi.setupCommentsApi(lambdas.commentsLambda)
    restApi.setupImagesApi(lambdas.imagesLambda)
    restApi.setupChristmasApi(lambdas.christmasLambda)
  }
}
