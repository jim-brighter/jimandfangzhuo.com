import { DefaultErrorLambda, NodeLambda } from "./backend/Lambda"

export type LambdaFunctions = {
  defaultErrorLambda: DefaultErrorLambda
  eventsLambda: NodeLambda
  commentsLambda: NodeLambda
  imagesLambda: NodeLambda
  christmasLambda: NodeLambda
}
