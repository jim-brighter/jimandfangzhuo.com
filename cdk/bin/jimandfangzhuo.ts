#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { APIStack } from '../lib/api-stack';
import { CertStack } from '../lib/cert-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { Region } from '../lib/constants';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { HostedZoneStack } from '../lib/hosted-zone-stack';
import { S3BucketStack } from '../lib/s3-bucket-stack';
import { UIStack } from '../lib/ui-stack';

const app = new App();

// CORE

const hostedZone = new HostedZoneStack(app, 'JimAndFangzhuoHostedZone', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_EAST_1 },
  crossRegionReferences: true
});

// CERTIFICATES

const westCert = new CertStack(app, 'JimAndFangzhuoCertWest', hostedZone.zone, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_WEST_2 },
  crossRegionReferences: true
});

const eastCert = new CertStack(app, 'JimAndFangzhuoCertEast', hostedZone.zone, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_EAST_1 },
  crossRegionReferences: true
});

const asiaCert = new CertStack(app, 'JimAndFangzhuoCertAsia', hostedZone.zone, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.AP_NORTHEAST_2 },
  crossRegionReferences: true
});

// UI stack needs to be created early because it creates the top level domain
const uiStack = new UIStack(app, 'JimAndFangzhuoFrontend', hostedZone.zone, eastCert.cert, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_EAST_1 }
});

const cognito = new CognitoStack(app, 'JimAndFangzhuoCognito', hostedZone.zone, westCert.cert, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_WEST_2 },
  crossRegionReferences: true
});

cognito.addDependency(uiStack); // requires the top level domain to be created first

// EAST BACKEND

const tables = new DynamoDBStack(app, 'JimAndFangzhuoDynamoDB', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_EAST_1 },
  crossRegionReferences: true
});

const eastBuckets = new S3BucketStack(app, 'JimAndFangzhuoS3BucketsEast', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_EAST_1 }
});

new APIStack(app, 'JimAndFangzhuoBackendEast', hostedZone.zone, eastCert.cert, tables, eastBuckets, cognito, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.US_EAST_1 },
  crossRegionReferences: true
});

// ASIA BACKEND

const asiaBuckets = new S3BucketStack(app, 'JimAndFangzhuoS3BucketsAsia', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.AP_NORTHEAST_2 }
});

new APIStack(app, 'JimAndFangzhuoBackendAsia', hostedZone.zone, asiaCert.cert, tables, asiaBuckets, cognito, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: Region.AP_NORTHEAST_2 },
  crossRegionReferences: true
});
