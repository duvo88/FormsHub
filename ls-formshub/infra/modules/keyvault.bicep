@description('Azure region for the Key Vault')
param location string

@description('Key Vault name')
param kv_name string

@description('Tags applied to the Key Vault')
param tags object

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kv_name
  location: location
  tags: tags
  properties: {
    enablePurgeProtection: true
    enableRbacAuthorization: true
    enableSoftDelete: true
    publicNetworkAccess: 'Enabled'
    sku: {
      family: 'A'
      name: 'standard'
    }
    softDeleteRetentionInDays: 7
    tenantId: subscription().tenantId
  }
}

output keyVaultId string = kv.id
output keyVaultName string = kv.name
output keyVaultUri string = kv.properties.vaultUri
