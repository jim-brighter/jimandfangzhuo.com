import { Stack, StackProps } from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { ApiGateway } from './backend/ApiGateway'
import { CognitoUserPool, setupAuthorizer } from './backend/Cognito'
import { DynamoTable } from './backend/DynamoDB'
import { ImageS3Bucket } from './backend/ImageS3Bucket'
import { DefaultErrorLambda, NodeLambda } from './backend/Lambda'
import { Cert } from './core/Cert'
import { ApiRecord } from './core/Route53'

const EVENT_TYPE_INDEX = 'EventsTypeIndex'

export class BackendStackWest extends Stack {
  constructor(scope: Construct, id: string,
              eventsTable: DynamoTable,
              commentsTable: DynamoTable,
              imagesTable: DynamoTable,
              christmasTable: DynamoTable,
              userPool: CognitoUserPool,
              props?: StackProps) {
    super(scope, id, props)

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'jimandfangzhuo.com'
    })

    // IMAGE S3 BUCKET
    const imagesBucket = new ImageS3Bucket(this, 'west')

    // LAMBDAS
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

    eventsTable.grantReadWriteData(eventsLambda)
    commentsTable.grantReadWriteData(commentsLambda)
    imagesTable.grantReadWriteData(imagesLambda)
    christmasTable.grantReadWriteData(christmasLambda)

    imagesBucket.grantReadWrite(imagesLambda)
    imagesBucket.grantPutAcl(imagesLambda)

    // ACM
    const cert = new Cert(this, hostedZone)

    // AUTHORIZER
    const authorizer = setupAuthorizer(this, userPool)

    // REST API
    const restApi = new ApiGateway(this, defaultErrorLambda, cert, authorizer)
    restApi.setupEventsApi(eventsLambda)
    restApi.setupCommentsApi(commentsLambda)
    restApi.setupImagesApi(imagesLambda)
    restApi.setupChristmasApi(christmasLambda)

    // ROUTE53 MAPPING
    new ApiRecord(this, 'ApiRecord', hostedZone, restApi, 'us-west-2')
  }
}
