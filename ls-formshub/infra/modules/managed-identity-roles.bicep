@description('Principal ID of the Logic App system-assigned MSI')
param logicAppPrincipalId string

@description('Principal ID of the Function App system-assigned MSI')
param functionAppPrincipalId string

@description('Principal ID of the Static Web App system-assigned MSI')
param staticWebAppPrincipalId string

@description('Resource ID of the Service Bus namespace')
param serviceBusId string

@description('Resource ID of the Storage Account')
param storageAccountId string

@description('Resource ID of the Key Vault')
param keyVaultId string

// Built-in role definition IDs
var sbDataReceiver     = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0')
var sbDataSender       = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '69a216fc-b8fb-44d8-bc22-1f3c2cd27a39')
var blobDataContrib    = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
var tableDataContrib   = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3')
var queueDataContrib   = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '974c5e8b-45b9-4653-ba55-5f855dd0fb88')
var kvSecretsUser      = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')

// Existing resource references (used for typed scope on role assignments)
resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' existing = {
  name: last(split(serviceBusId, '/'))
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: last(split(storageAccountId, '/'))
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' existing = {
  name: last(split(keyVaultId, '/'))
}

// Logic App MSI → Service Bus Data Receiver
resource laServiceBusReceiver 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(serviceBusId, logicAppPrincipalId, sbDataReceiver)
  scope: serviceBus
  properties: {
    roleDefinitionId: sbDataReceiver
    principalId: logicAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Logic App MSI → Storage Blob Data Contributor
resource laBlobContrib 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountId, logicAppPrincipalId, blobDataContrib)
  scope: storageAccount
  properties: {
    roleDefinitionId: blobDataContrib
    principalId: logicAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Function App MSI → Storage Blob Data Contributor
resource faBlobContrib 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountId, functionAppPrincipalId, blobDataContrib)
  scope: storageAccount
  properties: {
    roleDefinitionId: blobDataContrib
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Function App MSI → Storage Table Data Contributor
resource faTableContrib 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountId, functionAppPrincipalId, tableDataContrib)
  scope: storageAccount
  properties: {
    roleDefinitionId: tableDataContrib
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Function App MSI → Storage Queue Data Contributor
resource faQueueContrib 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountId, functionAppPrincipalId, queueDataContrib)
  scope: storageAccount
  properties: {
    roleDefinitionId: queueDataContrib
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Function App MSI → Service Bus Data Sender
resource faServiceBusSender 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(serviceBusId, functionAppPrincipalId, sbDataSender)
  scope: serviceBus
  properties: {
    roleDefinitionId: sbDataSender
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Function App MSI → Key Vault Secrets User
resource faKvSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVaultId, functionAppPrincipalId, kvSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: kvSecretsUser
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Static Web App MSI → Key Vault Secrets User
resource swaKvSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVaultId, staticWebAppPrincipalId, kvSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: kvSecretsUser
    principalId: staticWebAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}
