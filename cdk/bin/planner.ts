#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { FrontendStack } from '../lib/frontend-stack'
import { BackendStack } from '../lib/backend-stack'
import { HostedZoneStack } from '../lib/hosted-zone-stack'
import { BackendStackWest } from '../lib/backend-stack-west'

const app = new cdk.App()

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }

new HostedZoneStack(app, 'PlannerHostedZone', { env })

const east = new BackendStack(app, 'PlannerBackend', { env, crossRegionReferences: true })

new BackendStackWest(app, 'PlannerBackendWest',
  east.eventsTable,
  east.commentsTable,
  east.imagesTable,
  east.christmasTable,
  east.userPool,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-2'
    },
    crossRegionReferences: true
  })

new FrontendStack(app, 'PlannerFrontend', east.cert, { env })
