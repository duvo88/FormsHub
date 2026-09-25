@description('Azure region for the Logic App')
param location string

@description('Logic App name')
param logicAppName string

@description('Log Analytics workspace resource ID for diagnostic settings')
param logAnalyticsId string

@description('Tags applied to the Logic App')
param tags object

resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: logicAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    state: 'Enabled'
    // Placeholder definition (required by Azure - cannot be omitted)
    // IMPORTANT: Backend pipeline will overwrite this with actual workflow
    // Always run backend pipeline after infrastructure to restore the real definition
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      triggers: {}
      actions: {}
      outputs: {}
    }
  }
}

// Diagnostic settings → Log Analytics
resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'service'
  scope: logicApp
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'WorkflowRuntime'
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

output logicAppId string = logicApp.id
output logicAppName string = logicApp.name
output logicAppPrincipalId string = logicApp.identity.principalId
