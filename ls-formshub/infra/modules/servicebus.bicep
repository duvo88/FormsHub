@description('Azure region for the Service Bus Namespace')
param location string

@description('Service Bus namespace name')
param namespaceName string

@description('Tags applied to the Service Bus resources')
param tags object

resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    zoneRedundant: true
  }
}

// Topic: forms-submission
resource topic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: serviceBus
  name: 'forms-submission'
  properties: {
    defaultMessageTimeToLive: 'P14D'
    maxSizeInMegabytes: 5120
    requiresDuplicateDetection: false
    duplicateDetectionHistoryTimeWindow: 'PT5M'
    enableBatchedOperations: true
    supportOrdering: true
    autoDeleteOnIdle: 'P365D'
    enablePartitioning: false
    enableExpress: false
  }
}

// Subscription: form-submission-data
resource subscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: topic
  name: 'form-submission-data'
  properties: {
    lockDuration: 'PT5M'
    requiresSession: false
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: false
    deadLetteringOnFilterEvaluationExceptions: false
    maxDeliveryCount: 3
    enableBatchedOperations: false
    autoDeleteOnIdle: 'P365D'
  }
}

output serviceBusNamespaceId string = serviceBus.id
output serviceBusNamespaceName string = serviceBus.name
output serviceBusEndpoint string = serviceBus.properties.serviceBusEndpoint
