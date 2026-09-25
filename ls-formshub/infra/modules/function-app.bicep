@description('Azure region for the Function App')
param location string

@description('Function App name')
param functionAppName string

@description('App Service Plan resource ID')
param planId string

@description('Storage account name used for deployment packages')
param storageAccountName string

@description('App Insights connection string')
param appInsightsConnectionString string

@description('Log Analytics workspace resource ID for diagnostic settings')
param logAnalyticsId string

@description('Tags applied to the Function App')
param tags object

@description('Allowed CORS origins')
param corsAllowedOrigins array = []

resource storage 'Microsoft.Storage/storageAccounts@2024-01-01' existing = {
  name: storageAccountName
}

var deploymentContainerName = 'app-pkg-${toLower(functionAppName)}'

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2024-01-01' = {
  name: '${storage.name}/default'
}

resource deploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  name: '${storage.name}/default/${deploymentContainerName}'
  properties: {
    publicAccess: 'None'
  }
  dependsOn: [blobService]
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: planId
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      http20Enabled: true
      minTlsVersion: '1.3'
      cors: {
       allowedOrigins: corsAllowedOrigins
       supportCredentials: false
      }
      // Minimal required settings for Function App to be valid on creation
      // Backend pipeline adds complete configuration (26 settings total)
      // Note: FUNCTIONS_WORKER_RUNTIME not needed - set in functionAppConfig for Flex Consumption
      appSettings: [
        {
          name: 'DEPLOYMENT_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
        }
        {
          name: 'AzureWebJobsStorage__accountName'
          value: storageAccountName
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
      ]
    }
    functionAppConfig: {
      runtime: {
        name: 'dotnet-isolated'
        version: '8.0'
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 100
        instanceMemoryMB: 2048
      }
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storage.properties.primaryEndpoints.blob}${deploymentContainerName}'
          authentication: {
            type: 'StorageAccountConnectionString'
            storageAccountConnectionStringName: 'DEPLOYMENT_STORAGE_CONNECTION_STRING'
          }
        }
      }
    }
  }
  dependsOn: [deploymentContainer]
}

// Diagnostic settings → Log Analytics
resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'service'
  scope: functionApp
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'FunctionAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Authentication configuration - exclude webhook from auth requirements
// resource authSettings 'Microsoft.Web/sites/config@2023-12-01' = {
//   name: 'authsettingsV2'
//   parent: functionApp
//   properties: {
//     globalValidation: {
//       requireAuthentication: true
//       unauthenticatedClientAction: 'Return401'
//        excludedPaths: [
//         '/api/ProcessStripePaymentWebhook'
//       ]      
//     }
//     identityProviders: {
//       azureStaticWebApps: {
//         enabled: true
//       }
//     }
//     login: {
//       tokenStore: {
//         enabled: true  // ← enable token store
//       }
//     }
//   }
// }

output functionAppId string = functionApp.id
output functionAppName string = functionApp.name
output functionAppPrincipalId string = functionApp.identity.principalId
output deploymentContainerName string = deploymentContainerName
