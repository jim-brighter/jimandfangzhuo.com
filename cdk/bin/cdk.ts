#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PlannerBackend } from '../lib/backend-stack';
import { PlannerHostedZone } from '../lib/hosted-zone-stack';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

new PlannerHostedZone(app, 'PlannerHostedZone', {env});

new PlannerBackend(app, 'PlannerBackend', {env});
