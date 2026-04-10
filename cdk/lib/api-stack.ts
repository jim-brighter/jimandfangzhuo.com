import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs/lib/construct';
import { ApiGateway } from './backend/ApiGateway';
import { DefaultErrorLambda, NodeLambda } from './backend/Lambda';
import { CognitoStack } from './cognito-stack';
import { Region } from './constants';
import { ApiRecord } from './core/Route53';
import { DynamoDBStack } from './dynamodb-stack';
import { S3BucketStack } from './s3-bucket-stack';
import { setupAuthorizer } from './backend/Cognito';

export class APIStack extends Stack {

  constructor(scope: Construct,
    id: string,
    hostedZone: HostedZone,
    cert: Certificate,
    tableStack: DynamoDBStack,
    bucketStack: S3BucketStack,
    cognitoStack: CognitoStack,
    props?: StackProps) {
    super(scope, id, props);

    const defaultErrorLambda = new DefaultErrorLambda(this);

    const imagesLambda = this.createImagesLambda(tableStack, bucketStack);

    const authorizer = setupAuthorizer(this, cognitoStack.userPool);

    const restApi = new ApiGateway(this, defaultErrorLambda, cert, authorizer);

    restApi.setupImagesApi(imagesLambda);

    new ApiRecord(this, 'ApiRecord', hostedZone, restApi, props?.env?.region || Region.US_EAST_1);
  }

  private createImagesLambda(tableStack: DynamoDBStack, bucketStack: S3BucketStack) {
    const imagesLambda = new NodeLambda(this, 'ImagesHandler', '../lambda/images.ts', {
      ALBUM_METADATA_TABLE: tableStack.albumMetadataTable.tableName,
      IMAGES_BUCKET: bucketStack.bucket.bucketName
    });

    tableStack.albumMetadataTable.grantReadData(imagesLambda);
    bucketStack.bucket.grantRead(imagesLambda);

    return imagesLambda;
  }
}
