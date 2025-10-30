import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

export class DefaultErrorLambda extends Function {
  constructor(scope: Construct) {
    super(scope, 'DefaultErrorHandler', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      reservedConcurrentExecutions: 2,
      code: Code.fromInline(`
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
  }
}

export class NodeLambda extends NodejsFunction {
  constructor(scope: Construct, id: string, entry: string, environment: any) {
    super(scope, id, {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      entry,
      bundling: {
        minify: true
      },
      environment,
      logGroup: new LogGroup(scope, `${id}LogGroup`, {
        retention: RetentionDays.THREE_DAYS
      }),
      reservedConcurrentExecutions: 2
    })
  }
}
