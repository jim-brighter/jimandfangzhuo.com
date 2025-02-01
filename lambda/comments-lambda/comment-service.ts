import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Comment } from './comment'
import * as crypto from 'crypto'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.AWS_REGION
}),
{
    marshallOptions: {
        convertClassInstanceToMap: true
    }
})

const commentsTable = process.env.COMMENTS_TABLE || ''

const createComment = async(comment: Comment): Promise<Comment> => {
    comment.commentId = crypto.randomUUID()
    comment.createdTime = Date.now()

    try {
        await ddb.send(new PutCommand({
            TableName: commentsTable,
            Item: comment
        }))
    } catch(e) {
        console.error(`Error saving new comment with text ${comment.commentText}`, e)
        throw e
    }

    return comment
}

const getAllComments = async(): Promise<Array<Comment>> => {
    try {
        const allComments = await ddb.send(new ScanCommand({
            TableName: commentsTable
        }))

        return allComments.Items ? allComments.Items.map(i => i as Comment).sort((a, b) => a.createdTime - b.createdTime) : []
    } catch(e) {
        console.error(`Failed to retrieve all comments`, e)
        throw e
    }
}

export {
    createComment,
    getAllComments
}
