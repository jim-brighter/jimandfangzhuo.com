import * as aws from 'aws-sdk';
import { Comment } from './comment';
import * as crypto from 'crypto';

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

const commentsTable = process.env.COMMENTS_TABLE || '';

const createComment = async(comment: Comment): Promise<Comment> => {
    comment.commentId = crypto.randomUUID();
    comment.createdTime = new Date().getTime();

    try {
        await ddb.put({
            TableName: commentsTable,
            Item: comment
        }).promise();
    } catch(e) {
        console.error(`Error saving new comment with text ${comment.commentText}`, JSON.stringify(e));
        throw e;
    }

    return comment;
}

const getAllComments = async(): Promise<Array<Comment>> => {
    try {
        const allComments = await ddb.scan({
            TableName: commentsTable
        }).promise();

        return allComments.Items ? allComments.Items.map(i => i as Comment).sort((a, b) => a.createdTime - b.createdTime) : [];
    } catch(e) {
        console.error(`Failed to retrieve all comments`, e);
        throw e;
    }
}

export {
    createComment,
    getAllComments
}
