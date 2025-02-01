#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { FrontendStack } from '../lib/frontend-stack'
import { BackendStack } from '../lib/backend-stack'
import { HostedZoneStack } from '../lib/hosted-zone-stack'

const app = new cdk.App()

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }

new FrontendStack(app, 'PlannerFrontend', {env})

new BackendStack(app, 'PlannerBackend', {env})

new HostedZoneStack(app, 'PlannerHostedZone', {env})
