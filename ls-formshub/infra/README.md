# Forms Hub Infrastructure Guide

Infrastructure is managed with Bicep and deployed from one pipeline.

## Infrastructure Structure

```text
ls-formshub/infra/
  main.bicep
  modules/
  infra-deploy.yaml
```

## Deployment Model

- Single infra deployment pipeline: ls-formshub/infra/infra-deploy.yaml
- Main template: ls-formshub/infra/main.bicep
- Modules include monitoring, storage, service bus, API connections, function plan/app, logic app, static web app, and role assignments.

## Required Variable Groups

- Integration-ServiceConnections
- Integration-dev
- Integration-sit
- Integration-uat
- Integration-prd

## Key Vault Secret for ACS API Connection

The infra pipeline reads the ACS connection string from Key Vault secret:

- ACS-CONNECTION-STRING

## Security & Validation

The infrastructure pipeline includes:

✅ **Secret Scanning** - Scans for hardcoded secrets before deployment
✅ **Bicep What-If** - Previews infrastructure changes before applying
  - Shows which resources will be created/modified/deleted
  - Color-coded output with detailed progress messages
  - See [PRODUCTION_GUIDELINES.md](../../PRODUCTION_GUIDELINES.md) for details

## Recommended Deployment Order

1. Run infra deploy pipeline (target environment)
   - Wiz security scans run automatically (branch policy)
   - Bicep what-if shows preview
   - Review changes before deployment proceeds
2. Run app code deploy pipelines from ls-formshub/app
   - Unit tests run automatically
3. Run fee data seed pipeline if fee values changed
