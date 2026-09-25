@description('Static Web App name')
param swa_name string

@description('Azure region for the Static Web App (must be an SWA-supported region)')
param location string

@description('Tags applied to the Static Web App')
param tags object

resource swa 'Microsoft.Web/staticSites@2023-01-01' = {
  name: swa_name
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
    stagingEnvironmentPolicy: 'Enabled'
    provider: 'Custom'
  }
}

output staticWebAppId string = swa.id
output staticWebAppName string = swa.name
output defaultHostname string = swa.properties.defaultHostname
output staticWebAppPrincipalId string = swa.identity.principalId
output staticWebAppHostname string = swa.properties.defaultHostname
