@description('Azure region for API connections')
param location string

@description('Name for the Service Bus API connection')
param serviceBusConnectionName string

@description('Name for the Azure Blob API connection')
param azureBlobConnectionName string

@description('Name for the ACS Email API connection')
param acsEmailConnectionName string

@description('ACS Email connection string (from Key Vault secret)')
@secure()
param acsApiKey string

@description('Service Bus namespace name for MSI endpoint')
param serviceBusNamespaceName string

@description('Tags applied to all API connections')
param tags object

// Service Bus — connection string authentication
resource serviceBusConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: serviceBusConnectionName
  location: location
  tags: tags
  kind: 'V1'
  properties: {
    displayName: serviceBusConnectionName
    api: {
      id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'servicebus')
    }
      parameterValueSet: {
      name: 'managedIdentityAuth'
      values: {
        namespaceEndpoint: {
          value: 'sb://${serviceBusNamespaceName}.servicebus.windows.net/'
        }
      }
    }
  }
}

// Azure Blob — connection string authentication
resource azureBlobConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: azureBlobConnectionName
  location: location
  tags: tags
  kind: 'V1'
  properties: {
    displayName: azureBlobConnectionName
    api: {
      id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'azureblob')
    }
    parameterValueSet: {
      name: 'managedIdentityAuth'
      values: {}
    }
  }
}

// ACS Email — connection string authentication
resource acsEmailConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: acsEmailConnectionName
  location: location
  tags: tags
  properties: {
    displayName: acsEmailConnectionName
    api: {
      id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'acsemail')
    }
    parameterValues: {
      api_key: acsApiKey
    }
  }
}

output serviceBusConnectionId string = serviceBusConnection.id
output azureBlobConnectionId string = azureBlobConnection.id
output acsEmailConnectionId string = acsEmailConnection.id
