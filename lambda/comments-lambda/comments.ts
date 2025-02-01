import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { Comment, PlannerComment } from './comment'
import * as commentService from './comment-service'

export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const headers = {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Credentials': true
    }
    switch(event.httpMethod) {
        case 'GET':
            try {
                const allComments: Comment[] = await commentService.getAllComments()
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(allComments)
                }
            } catch(e) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        errorMessage: 'Error retrieving all comments'
                    })
                }
            }
        case 'POST':
            let commentContent: Comment = new PlannerComment(event.body && JSON.parse(event.body))
            if (commentContent.validateNewComment()) {
                try {
                    commentContent = await commentService.createComment(commentContent)
                    return {
                        statusCode: 201,
                        headers,
                        body: JSON.stringify(commentContent)
                    }
                } catch(e) {
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            errorMessage: `Error creating comment with text ${commentContent.commentText}`
                        })
                    }
                }
            }
            else {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        errorMessage: 'Invalid comment'
                    })
                }
            }
        default:
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    errorMessage: 'Operation not supported'
                })
            }
    }
}
