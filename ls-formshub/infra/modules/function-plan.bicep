@description('Azure region for the Function App Service Plan')
param location string

@description('Function App Service Plan name')
param planName string

@description('Tags applied to the Function App Service Plan')
param tags object

resource functionPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: planName
  location: location
  kind: 'functionapp'
  tags: tags
  sku: {
    capacity: 0
    family: 'FC'
    name: 'FC1'
    size: 'FC1'
    tier: 'FlexConsumption'
  }
  properties: {
    reserved: true
  }
}

output planId string = functionPlan.id
output planName string = functionPlan.name
