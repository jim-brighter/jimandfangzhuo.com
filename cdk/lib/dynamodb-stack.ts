import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs/lib/construct';
import { DynamoTable, setupBackupPlan } from './backend/DynamoDB';

export class DynamoDBStack extends Stack {

  readonly albumMetadataTable: DynamoTable;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.albumMetadataTable = new DynamoTable(this, 'AlbumMetadataTable', 'albumId', 'AlbumMetadata');
    setupBackupPlan(this, [this.albumMetadataTable]);
  }
}
