const aws = require('aws-sdk');

const ddb = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    apiVersion: 'latest'
});

exports.handler = async event => {
    return {
        statusCode: 200,
        body: 'hello from the events handler'
    }
};
