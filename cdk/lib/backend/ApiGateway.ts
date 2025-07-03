import { CognitoUserPoolsAuthorizer, LambdaIntegration, LambdaRestApi, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

export class ApiGateway extends LambdaRestApi {

  private authorizer: CognitoUserPoolsAuthorizer

  constructor(scope: Construct, defaultErrorLambda: IFunction, cert: ICertificate, authorizer: CognitoUserPoolsAuthorizer) {
    super(scope, 'PlannerApi', {
      handler: defaultErrorLambda,
      proxy: false,
      domainName: {
        certificate: cert,
        domainName: 'api.jimandfangzhuo.com',
        securityPolicy: SecurityPolicy.TLS_1_2
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowHeaders: ['*'],
        allowCredentials: true
      },
      deployOptions: {
        throttlingBurstLimit: 3,
        throttlingRateLimit: 5
      }
    })

    this.authorizer = authorizer

    this.root.addResource('api')
  }

  setupEventsApi(handler: IFunction) {
    const eventsLambdaIntegration = new LambdaIntegration(handler)
    const api = this.root.getResource('api')

    const eventsApi = api?.addResource('events')
    eventsApi?.addMethod('GET', eventsLambdaIntegration, { authorizer: this.authorizer })
    eventsApi?.addMethod('POST', eventsLambdaIntegration, { authorizer: this.authorizer })
    eventsApi?.addMethod('PUT', eventsLambdaIntegration, { authorizer: this.authorizer })
    eventsApi?.addMethod('DELETE', eventsLambdaIntegration, { authorizer: this.authorizer })

    const eventsTypeApi = eventsApi?.addResource('{eventType}')
    eventsTypeApi?.addMethod('GET', eventsLambdaIntegration, { authorizer: this.authorizer })
  }

  setupCommentsApi(handler: IFunction) {
    const commentsLambdaIntegration = new LambdaIntegration(handler)
    const api = this.root.getResource('api')

    const commentsApi = api?.addResource('comments')
    commentsApi?.addMethod('GET', commentsLambdaIntegration, { authorizer: this.authorizer })
    commentsApi?.addMethod('POST', commentsLambdaIntegration, { authorizer: this.authorizer })
  }

  setupImagesApi(handler: IFunction) {
    const imagesLambdaIntegration = new LambdaIntegration(handler)
    const api = this.root.getResource('api')

    const imagesApi = api?.addResource('images')
    imagesApi?.addMethod('GET', imagesLambdaIntegration, { authorizer: this.authorizer })
    imagesApi?.addMethod('POST', imagesLambdaIntegration, { authorizer: this.authorizer })
  }

  setupChristmasApi(handler: IFunction) {
    const christmasLambdaIntegration = new LambdaIntegration(handler)
    const api = this.root.getResource('api')

    const christmasApi = api?.addResource('christmas')
    christmasApi?.addMethod('GET', christmasLambdaIntegration)
    christmasApi?.addMethod('POST', christmasLambdaIntegration, { authorizer: this.authorizer })
    christmasApi?.addMethod('PUT', christmasLambdaIntegration, { authorizer: this.authorizer })
    christmasApi?.addMethod('DELETE', christmasLambdaIntegration, { authorizer: this.authorizer })
  }
}
