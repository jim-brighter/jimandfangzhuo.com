import { RemovalPolicy } from 'aws-cdk-lib'
import { BackupPlan, BackupResource } from 'aws-cdk-lib/aws-backup'
import { AttributeType, BillingMode, ProjectionType, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export class DynamoTable extends Table {
  constructor(scope: Construct, id: string, partitionKeyName: string, tableName: string) {
    super(scope, id, {
      partitionKey: {
        name: partitionKeyName,
        type: AttributeType.STRING
      },
      encryption: TableEncryption.AWS_MANAGED,
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      deletionProtection: false,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
        recoveryPeriodInDays: 14
      },
      replicationRegions: ['us-west-2']
    })
  }

  setupGSI(indexName: string, partitionKeyName: string)  {
    this.addGlobalSecondaryIndex({
      indexName: indexName,
      partitionKey: {
        name: partitionKeyName,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.ALL
    })
  }
}

export function setupBackupPlan(scope: Construct, tables: Table[]) {
  const plan = BackupPlan.daily35DayRetention(scope, 'BackupPlan')
  plan.addSelection('BackupSelection', {
    resources: tables.map(table => BackupResource.fromDynamoDbTable(table))
  })
}
