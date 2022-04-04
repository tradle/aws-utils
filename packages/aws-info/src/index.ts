import type { Country, RegionIdx, Region, RegionCode } from './types'
export * from './types'

let countries: readonly Country[]
let countryById: { readonly [idx: string]: Country }
let countryByCallingCode: { readonly [callingCode: string]: Country }
let regions: readonly Region[]
let regionCodes: readonly RegionCode[]
let regionByIdx: { readonly [idx in RegionIdx]: Region }
let regionByCode: { readonly [regionCode in RegionCode]: Region }

type DeepFrozen <T> =
  T extends Object
    ? { readonly [key in keyof T]: T[key] }
    : T

function deepFreeze <T extends { [key: string]: any }>(input: T): DeepFrozen<T> {
  for (const key in input) {
    const value = input[key]
    if (typeof value === 'object') {
      input[key] = deepFreeze(value)
    }
  }
  return Object.freeze(input) as DeepFrozen<T>
}

// From https://gist.github.com/shortjared/4c1e3fe52bdfa47522cfe5b41e5d6f22?permalink_comment_id=4080835#gistcomment-4080835
const SERVICE_PRINCIPALS = Object.freeze({
  a4b: 'a4b.amazonaws.com',
  accessAnalyzer: 'access-analyzer.amazonaws.com',
  account: 'account.amazonaws.com',
  acmPca: 'acm-pca.amazonaws.com',
  acm: 'acm.amazonaws.com',
  airflowEnv: 'airflow-env.amazonaws.com',
  airflow: 'airflow.amazonaws.com',
  alexaAppkit: 'alexa-appkit.amazon.com',
  alexaConnectedhome: 'alexa-connectedhome.amazon.com',
  amazonmq: 'amazonmq.amazonaws.com',
  amplify: 'amplify.amazonaws.com',
  apigateway: 'apigateway.amazonaws.com',
  appflow: 'appflow.amazonaws.com',
  applicationAutoscaling: 'application-autoscaling.amazonaws.com',
  applicationInsights: 'application-insights.amazonaws.com',
  appstream: 'appstream.amazonaws.com',
  appstreamApplicationAutoscaling: 'appstream.application-autoscaling.amazonaws.com',
  appsync: 'appsync.amazonaws.com',
  athena: 'athena.amazonaws.com',
  automation: 'automation.amazonaws.com',
  autoscaling: 'autoscaling.amazonaws.com',
  awsArtifactAccountSync: 'aws-artifact-account-sync.amazonaws.com',
  backup: 'backup.amazonaws.com',
  batch: 'batch.amazonaws.com',
  billingconsole: 'billingconsole.amazonaws.com',
  braket: 'braket.amazonaws.com',
  budgets: 'budgets.amazonaws.com',
  ce: 'ce.amazonaws.com',
  channelsLex: 'channels.lex.amazonaws.com',
  chatbot: 'chatbot.amazonaws.com',
  chime: 'chime.amazonaws.com',
  cloud9: 'cloud9.amazonaws.com',
  clouddirectory: 'clouddirectory.amazonaws.com',
  cloudformation: 'cloudformation.amazonaws.com',
  cloudfront: 'cloudfront.amazonaws.com',
  cloudhsm: 'cloudhsm.amazonaws.com',
  cloudsearch: 'cloudsearch.amazonaws.com',
  cloudtrail: 'cloudtrail.amazonaws.com',
  cloudwatchCrossaccount: 'cloudwatch-crossaccount.amazonaws.com',
  cloudwatch: 'cloudwatch.amazonaws.com',
  codebuild: 'codebuild.amazonaws.com',
  codecommit: 'codecommit.amazonaws.com',
  codedeployRegion: 'codedeploy.<region>.amazonaws.com',
  codedeploy: 'codedeploy.amazonaws.com',
  codeguruReviewer: 'codeguru-reviewer.amazonaws.com',
  codepipeline: 'codepipeline.amazonaws.com',
  codestarNotifications: 'codestar-notifications.amazonaws.com',
  codestar: 'codestar.amazonaws.com',
  cognitoIdentity: 'cognito-identity.amazonaws.com',
  cognitoIdp: 'cognito-idp.amazonaws.com',
  cognitoSync: 'cognito-sync.amazonaws.com',
  comprehend: 'comprehend.amazonaws.com',
  configConforms: 'config-conforms.amazonaws.com',
  configMultiaccountsetup: 'config-multiaccountsetup.amazonaws.com',
  config: 'config.amazonaws.com',
  connect: 'connect.amazonaws.com',
  continuousexportDiscovery: 'continuousexport.discovery.amazonaws.com',
  costalerts: 'costalerts.amazonaws.com',
  customResourceApplicationAutoscaling: 'custom-resource.application-autoscaling.amazonaws.com',
  databrew: 'databrew.amazonaws.com',
  datapipeline: 'datapipeline.amazonaws.com',
  datasync: 'datasync.amazonaws.com',
  dax: 'dax.amazonaws.com',
  deeplens: 'deeplens.amazonaws.com',
  deliveryLogs: 'delivery.logs.amazonaws.com',
  detective: 'detective.amazonaws.com',
  diode: 'diode.amazonaws.com',
  directconnect: 'directconnect.amazonaws.com',
  discovery: 'discovery.amazonaws.com',
  dlm: 'dlm.amazonaws.com',
  dms: 'dms.amazonaws.com',
  ds: 'ds.amazonaws.com',
  dynamodb: 'dynamodb.amazonaws.com',
  dynamodbApplicationAutoscaling: 'dynamodb.application-autoscaling.amazonaws.com',
  ec: 'ec.amazonaws.com',
  ec2: 'ec2.amazonaws.com',
  ec2ApplicationAutoscaling: 'ec2.application-autoscaling.amazonaws.com',
  ec2fleet: 'ec2fleet.amazonaws.com',
  ec2scheduled: 'ec2scheduled.amazonaws.com',
  ecr: 'ecr.amazonaws.com',
  ecsTasks: 'ecs-tasks.amazonaws.com',
  ecs: 'ecs.amazonaws.com',
  ecsApplicationAutoscaling: 'ecs.application-autoscaling.amazonaws.com',
  edgelambda: 'edgelambda.amazonaws.com',
  eksFargatePods: 'eks-fargate-pods.amazonaws.com',
  eksFargate: 'eks-fargate.amazonaws.com',
  eksNodegroup: 'eks-nodegroup.amazonaws.com',
  eks: 'eks.amazonaws.com',
  elasticache: 'elasticache.amazonaws.com',
  elasticbeanstalk: 'elasticbeanstalk.amazonaws.com',
  elasticfilesystem: 'elasticfilesystem.amazonaws.com',
  elasticloadbalancing: 'elasticloadbalancing.amazonaws.com',
  elasticmapreduce: 'elasticmapreduce.amazonaws.com',
  elastictranscoder: 'elastictranscoder.amazonaws.com',
  emailCognitoIdp: 'email.cognito-idp.amazonaws.com',
  emrContainers: 'emr-containers.amazonaws.com',
  es: 'es.amazonaws.com',
  events: 'events.amazonaws.com',
  firehose: 'firehose.amazonaws.com',
  fis: 'fis.amazonaws.com',
  fms: 'fms.amazonaws.com',
  forecast: 'forecast.amazonaws.com',
  freertos: 'freertos.amazonaws.com',
  fsx: 'fsx.amazonaws.com',
  galaxy: 'galaxy.amazonaws.com',
  gamelift: 'gamelift.amazonaws.com',
  glacier: 'glacier.amazonaws.com',
  globalaccelerator: 'globalaccelerator.amazonaws.com',
  glue: 'glue.amazonaws.com',
  greengrass: 'greengrass.amazonaws.com',
  guardduty: 'guardduty.amazonaws.com',
  health: 'health.amazonaws.com',
  honeycode: 'honeycode.amazonaws.com',
  hooksCloudformation: 'hooks.cloudformation.amazonaws.com',
  iam: 'iam.amazonaws.com',
  imagebuilder: 'imagebuilder.amazonaws.com',
  importexport: 'importexport.amazonaws.com',
  inspector: 'inspector.amazonaws.com',
  inspector2: 'inspector2.amazonaws.com',
  iot: 'iot.amazonaws.com',
  iotanalytics: 'iotanalytics.amazonaws.com',
  iotevents: 'iotevents.amazonaws.com',
  iotsitewise: 'iotsitewise.amazonaws.com',
  iotthingsgraph: 'iotthingsgraph.amazonaws.com',
  ivs: 'ivs.amazonaws.com',
  jellyfish: 'jellyfish.amazonaws.com',
  kafka: 'kafka.amazonaws.com',
  kinesis: 'kinesis.amazonaws.com',
  kinesisGovRegion: 'kinesis.<region>.amazonaws.com',
  kinesisanalytics: 'kinesisanalytics.amazonaws.com',
  kms: 'kms.amazonaws.com',
  lakeformation: 'lakeformation.amazonaws.com',
  lambda: 'lambda.amazonaws.com',
  lex: 'lex.amazonaws.com',
  licenseManager: 'license-manager.amazonaws.com',
  lightsail: 'lightsail.amazonaws.com',
  loggerCloudfront: 'logger.cloudfront.amazonaws.com',
  logs: 'logs.amazonaws.com',
  machinelearning: 'machinelearning.amazonaws.com',
  macie: 'macie.amazonaws.com',
  managedblockchain: 'managedblockchain.amazonaws.com',
  managedservices: 'managedservices.amazonaws.com',
  mediaconnect: 'mediaconnect.amazonaws.com',
  mediaconvert: 'mediaconvert.amazonaws.com',
  mediapackage: 'mediapackage.amazonaws.com',
  mediastore: 'mediastore.amazonaws.com',
  mediatailor: 'mediatailor.amazonaws.com',
  memberOrgStacksetsCloudformation: 'member.org.stacksets.cloudformation.amazonaws.com',
  meteringMarketplace: 'metering-marketplace.amazonaws.com',
  mgn: 'mgn.amazonaws.com',
  migrationhub: 'migrationhub.amazonaws.com',
  mobileanalytics: 'mobileanalytics.amazonaws.com',
  mobilehub: 'mobilehub.amazonaws.com',
  monitoring: 'monitoring.amazonaws.com',
  monitoringRds: 'monitoring.rds.amazonaws.com',
  mq: 'mq.amazonaws.com',
  networkFirewall: 'network-firewall.amazonaws.com',
  opsApigateway: 'ops.apigateway.amazonaws.com',
  opsdatasyncSsm: 'opsdatasync.ssm.amazonaws.com',
  opsworksCm: 'opsworks-cm.amazonaws.com',
  opsworks: 'opsworks.amazonaws.com',
  organizations: 'organizations.amazonaws.com',
  personalize: 'personalize.amazonaws.com',
  pinpoint: 'pinpoint.amazonaws.com',
  polly: 'polly.amazonaws.com',
  purchaseorders: 'purchaseorders.amazonaws.com',
  qldb: 'qldb.amazonaws.com',
  quicksight: 'quicksight.amazonaws.com',
  ram: 'ram.amazonaws.com',
  rdsPreview: 'rds-preview.amazonaws.com',
  rds: 'rds.amazonaws.com',
  redshift: 'redshift.amazonaws.com',
  regionElasticacheSnapshot: 'region.elasticache-snapshot.amazonaws.com',
  rekognition: 'rekognition.amazonaws.com',
  replicationDynamodb: 'replication.dynamodb.amazonaws.com',
  replicatorLambda: 'replicator.lambda.amazonaws.com',
  resourceGroups: 'resource-groups.amazonaws.com',
  resourceCloudformation: 'resource.cloudformation.amazonaws.com',
  robomaker: 'robomaker.amazonaws.com',
  route53: 'route53.amazonaws.com',
  route53domains: 'route53domains.amazonaws.com',
  route53resolver: 'route53resolver.amazonaws.com',
  s3: 's3.amazonaws.com',
  sagemaker: 'sagemaker.amazonaws.com',
  secretsmanager: 'secretsmanager.amazonaws.com',
  securityhub: 'securityhub.amazonaws.com',
  serverlessrepo: 'serverlessrepo.amazonaws.com',
  servicecatalogAppregistry: 'servicecatalog-appregistry.amazonaws.com',
  servicecatalog: 'servicecatalog.amazonaws.com',
  servicediscovery: 'servicediscovery.amazonaws.com',
  ses: 'ses.amazonaws.com',
  shield: 'shield.amazonaws.com',
  signer: 'signer.amazonaws.com',
  signin: 'signin.amazonaws.com',
  sms: 'sms.amazonaws.com',
  sns: 'sns.amazonaws.com',
  spotfleet: 'spotfleet.amazonaws.com',
  sqs: 'sqs.amazonaws.com',
  ssmIncidents: 'ssm-incidents.amazonaws.com',
  ssm: 'ssm.amazonaws.com',
  sso: 'sso.amazonaws.com',
  states: 'states.amazonaws.com',
  storageLensS3: 'storage-lens.s3.amazonaws.com',
  storagegateway: 'storagegateway.amazonaws.com',
  streamsMetricsCloudwatch: 'streams.metrics.cloudwatch.amazonaws.com',
  sts: 'sts.amazonaws.com',
  support: 'support.amazonaws.com',
  swf: 'swf.amazonaws.com',
  tagging: 'tagging.amazonaws.com',
  tagpoliciesTag: 'tagpolicies.tag.amazonaws.com',
  tasksApprunner: 'tasks.apprunner.amazonaws.com',
  textract: 'textract.amazonaws.com',
  timestream: 'timestream.amazonaws.com',
  transcribe: 'transcribe.amazonaws.com',
  transfer: 'transfer.amazonaws.com',
  transitgateway: 'transitgateway.amazonaws.com',
  translate: 'translate.amazonaws.com',
  trustedadvisor: 'trustedadvisor.amazonaws.com',
  tts: 'tts.amazonaws.com',
  vmie: 'vmie.amazonaws.com',
  vpcFlowLogs: 'vpc-flow-logs.amazonaws.com',
  wafRegional: 'waf-regional.amazonaws.com',
  waf: 'waf.amazonaws.com',
  wam: 'wam.amazonaws.com',
  workdocs: 'workdocs.amazonaws.com',
  worklink: 'worklink.amazonaws.com',
  workmail: 'workmail.amazonaws.com',
  workspaces: 'workspaces.amazonaws.com',
  xray: 'xray.amazonaws.com',
})


export const info = Object.freeze({
  get servicePrincipals () {
    // Even though this is not dynamic atm. it may be dynamic in future which
    // is why this is a get already.
    return SERVICE_PRINCIPALS
  },
  get countries () {
    if (countries === undefined) {
      countries = deepFreeze(require('./data').getCountries())
    }
    return countries
  },
  /**
   * Countries mapped by their .idx property
   */
  get countryById () {
    if (countryById === undefined) {
      countryById = Object.freeze(info.countries.reduce((byId, country) => {
        byId[country.id] = country
        return byId
      }, {}))
    }
    return countryById
  },
  /**
   * The longest calling code of all known calling codes
   */
  get longestCallingCode (): number {
    return require('./data').LONGEST_CALLING_CODE
  },
  /**
   * Countries by their phone number calling code
   */
  get countryByCallingCode () {
    if (countryByCallingCode === undefined) {
      countryByCallingCode = Object.freeze(info.countries.reduce((byCCD, country) => {
        for (const callingCode of country.callingCodes) {
          byCCD[callingCode] = country
        }
        return byCCD
      }, {}))
    }
    return countryByCallingCode
  },
  get regions () {
    if (regions === undefined) {
      regions = deepFreeze(require('./data').getCountries())
    }
    return regions
  },
  /**
   * All known/used region codes
   */
  get regionCodes () {
    if (regionCodes === undefined) {
      regionCodes = Object.freeze(info.regions.map(region => region.code) as RegionCode[])
    }
    return regionCodes
  },
  /**
   * Regions mapped by their .idx property
   */
  get regionByIdx () {
    if (regionByIdx === undefined) {
      regionByIdx = Object.freeze(info.regions.reduce((byIdx, region) => {
        byIdx[region.idx] = region
        return byIdx
      }, {} as { [idx in RegionIdx]: Region }))
    }
    return regionByIdx
  },
  /**
   * Regions mapped by their .code property
   */
  get regionByCode () {
    if (regionByCode === undefined) {
      regionByCode = Object.freeze(info.regions.reduce((byCode, region) => {
        byCode[region.code] = region
        return byCode
      }, {} as { [regionCode in RegionCode]: Region }))
    }
    return regionByCode
  }
})
