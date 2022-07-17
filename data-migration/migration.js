const aws = require('aws-sdk');
const fs = require('fs');
const crypto = require('crypto');
const csv = require('csv-parser');

const ddb = new aws.DynamoDB.DocumentClient({
    region: 'us-east-1',
    apiVersion: 'latest'
});

const columnMappings = {
    comment_id: 'commentId',
    comment_text: 'commentText',
    comment_created_time: 'createdTime',
    image_id: 'imageId',
    digital_ocean_key: 's3ObjectKey',
    event_id: 'eventId',
    event_created_time: 'createdTime',
    event_description: 'description',
    event_status: 'eventStatus',
    event_type: 'eventType',
    event_title: 'title',
    fk_event: 'ignore_header',
    rotation: 'ignore_header'
};

const dynamoTable = process.argv[3];

const fileName = process.argv[2];

fs.createReadStream(fileName)
.pipe(csv({
    mapHeaders: ({header, index}) => {
        return columnMappings[header];
    },
    mapValues: ({header, index, value}) => {
        if (header && header.endsWith('Id')) {
            return crypto.randomUUID();
        }
        else if (header && header === 'createdTime') {
            return new Date(value).getTime();
        }
        else if (header && header === 'ignore_header') {
            return null;
        }
        else {
            return value;
        }
    }
}))
.on('data', (data) => {
    console.log(data);
    ddb.put({
        TableName: dynamoTable,
        Item: data
    }, (err, ddbData) => {
        if (err) {
            console.error(err);
        }
        else {
            console.log('Wrote to Dynamo');
        }
    });
})
.on('end', () => {
    console.log();
    console.log(`✅ ${fileName} done`);
});
