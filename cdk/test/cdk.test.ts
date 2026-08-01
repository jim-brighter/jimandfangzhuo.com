import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { S3BucketStack } from '../lib/s3-bucket-stack';

test('S3 Buckets configured with Standard-IA transition after 30 days', () => {
  const app = new cdk.App();
  const stack = new S3BucketStack(app, 'TestS3BucketStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::S3::Bucket', {
    LifecycleConfiguration: {
      Rules: [
        {
          Status: 'Enabled',
          ExpiredObjectDeleteMarker: true,
          Transitions: [
            {
              StorageClass: 'STANDARD_IA',
              TransitionInDays: 30
            }
          ]
        }
      ]
    }
  });
});
