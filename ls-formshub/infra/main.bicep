@description('Deployment environment')
@allowed([
  'dev'
  'sit'
  'uat'
  'prd'
])
param environment string

@description('Primary Azure region')
param location string

@description('Application short name used in all resource names')
param appName string

@description('ACS Email connection string (from Key Vault secret)')
@secure()
param acsApiKey string

//
// SQL Parameters
//

param sqlSKU string = 'S0'
param sqlAdminGroupID string
param sqlAdminGroupName string

@secure()
param AzureSQLadminPassword string

// --------------------------------------------------
// Global tags
// --------------------------------------------------
var envUpper = toUpper(environment)

var tags = {
  Application: 'FormsHub'
  Environment: envUpper
  Owner: 'Mihir Mehta'
  CreatedBy: 'TL Consulting - BICEP'
}

// --------------------------------------------------
// Derived resource names — follow existing convention
// --------------------------------------------------
var prefix = 'az-ae'

var logAnalyticsName = '${prefix}-log-${appName}-${environment}'
var appInsightsName = '${prefix}-appi-${appName}-${environment}'
var storageAccountName = 'azaest${appName}${environment}'
var keyVaultName = '${prefix}-kv-${appName}-${environment}'
var serviceBusName = '${prefix}-sbns-${appName}-${environment}'
var functionPlanName = '${prefix}-asp-${appName}-${environment}'
var functionAppName = '${prefix}-func-${appName}-${environment}'
var logicAppName = '${prefix}-logic-${appName}-${environment}'
var staticWebAppName = '${prefix}-stapp-${appName}-${environment}'
var sbConnectionName = 'servicebus-conn-${appName}-${environment}'
var blobConnectionName = 'azureblob-conn-${appName}-${environment}'
var acsEmailConnectionName = 'acsemail-conn-${appName}-${environment}'
var sqlServerName = '${prefix}-sql-${appName}-${environment}'
var sqlDBName = '${prefix}-sqldb-${appName}-${environment}'

// --------------------------------------------------
// Custom domains
// --------------------------------------------------
var customDomain = environment == 'uat'
  ? 'https://uat-formshub.lawsociety.com.au'
  : environment == 'prd' ? 'https://formshub.lawsociety.com.au' : ''

// --------------------------------------------------
// Modules
// --------------------------------------------------

module monitoring './modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    logAnalyticsName: logAnalyticsName
    appInsightsName: appInsightsName
    tags: tags
  }
}

module storage './modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    storageAccountName: storageAccountName
    tags: tags
    allowedOrigins: concat(
      [
        'https://${staticWebApp.outputs.staticWebAppHostname}'
      ],
      empty(customDomain)
        ? []
        : [
            customDomain
          ]
    )
  }
}

//
// SQL Server & Database
//
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: 'lsdba'
    administratorLoginPassword: AzureSQLadminPassword
    publicNetworkAccess: 'Enabled'
  }
}

resource allowAzureFw 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'PH IP'
  properties: {
    startIpAddress: '14.200.216.14'
    endIpAddress: '14.200.216.14'
  }
}

// This ticks the option to allow azure services and resources to access this server
resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  name: 'AllowAllWindowsAzureIps' // Note: This specific name is recommended for consistency
  parent: sqlServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlAadAdmin 'Microsoft.Sql/servers/administrators@2023-08-01-preview' = {
  parent: sqlServer
  name: 'ActiveDirectory'

  properties: {
    administratorType: 'ActiveDirectory'
    login: sqlAdminGroupName
    sid: sqlAdminGroupID
    tenantId: subscription().tenantId
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDBName
  location: location
  tags: tags
  sku: {
    name: sqlSKU
  }
}

// Key Vault is created manually before running this pipeline — reference the existing one
resource existingKv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

module servicebus './modules/servicebus.bicep' = {
  name: 'servicebus'
  params: {
    location: location
    namespaceName: serviceBusName
    tags: tags
  }
}

module apiConnections './modules/api-connections.bicep' = {
  name: 'api-connections'
  params: {
    location: location
    serviceBusConnectionName: sbConnectionName
    azureBlobConnectionName: blobConnectionName
    acsEmailConnectionName: acsEmailConnectionName
    serviceBusNamespaceName: serviceBusName
    acsApiKey: acsApiKey
    tags: tags
  }
}

module functionPlan './modules/function-plan.bicep' = {
  name: 'function-plan'
  params: {
    location: location
    planName: functionPlanName
    tags: tags
  }
}

module staticWebApp './modules/staticwebapp.bicep' = {
  name: 'staticwebapp'
  params: {
    location: 'eastus2'
    swa_name: staticWebAppName
    tags: tags
  }
}

module functionApp './modules/function-app.bicep' = {
  name: 'function-app'
  params: {
    location: location
    functionAppName: functionAppName
    planId: functionPlan.outputs.planId
    storageAccountName: storage.outputs.storageAccountName
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    logAnalyticsId: monitoring.outputs.logAnalyticsId
    tags: tags
    corsAllowedOrigins: concat(
      [
        'https://${staticWebApp.outputs.staticWebAppHostname}'
        'https://portal.azure.com'
      ],
      empty(customDomain)
        ? []
        : [
            customDomain
          ]
    )
  }
}

module logicapp './modules/logicapp.bicep' = {
  name: 'logicapp'
  params: {
    location: location
    logicAppName: logicAppName
    logAnalyticsId: monitoring.outputs.logAnalyticsId
    tags: tags
  }
}

module managedIdentityRoles './modules/managed-identity-roles.bicep' = {
  name: 'managed-identity-roles'
  params: {
    logicAppPrincipalId: logicapp.outputs.logicAppPrincipalId
    functionAppPrincipalId: functionApp.outputs.functionAppPrincipalId
    staticWebAppPrincipalId: staticWebApp.outputs.staticWebAppPrincipalId
    serviceBusId: servicebus.outputs.serviceBusNamespaceId
    storageAccountId: storage.outputs.storageAccountId
    keyVaultId: existingKv.id
  }
}

// --------------------------------------------------
// Outputs
// --------------------------------------------------
output names object = {
  logAnalytics: logAnalyticsName
  appInsights: appInsightsName
  storage: storageAccountName
  keyVault: keyVaultName
  serviceBus: serviceBusName
  functionPlan: functionPlanName
  functionApp: functionAppName
  logicApp: logicAppName
  staticWebApp: staticWebAppName
}
