# Forms Hub App Guide

This guide covers local development and app deployment entry pipelines.

## App Structure

```text
ls-formshub/app/
  az-ae-fa-formshub-functionapp/
    apps.sln
  logicApp/
  web/
  FeeLogic.Tests/
```

## Local Development

### Prerequisites

- .NET SDK 8.0+
- Node.js 18+
- Azure Functions Core Tools v4
- Azure CLI

### Azure Login

```powershell
az login
az account set --subscription "<subscription-name-or-id>"
```

### Run Function App

```powershell
cd ls-formshub/app/az-ae-fa-formshub-functionapp
dotnet restore
dotnet build
cd bin/Debug/net8.0
func host start
```

### Run Web App

```powershell
cd ls-formshub/app/web
npm install
npm start
```

### Run Tests

#### React Unit Tests
```powershell
cd ls-formshub/app/web
npm test
```

#### Function App Unit Tests
```powershell
cd ls-formshub/app/az-ae-fa-formshub-functionapp
dotnet test
```

#### FeeLogic Integration Tests
```powershell
cd ls-formshub/app/FeeLogic.Tests
dotnet test
```
cd ls-formshub/app/az-ae-fa-formshub-functionapp
dotnet test ..\FeeLogic.Tests\FeeLogic.Tests.csproj
```

## Deployment Entry Pipelines (App)

The app layer is consolidated into two entry pipelines:

- Backend deploy (Function App + Logic App + optional fee seeding): ls-formshub/app/azure-pipeline-formhub-backend.yaml
- Frontend deploy (Static Web App): ls-formshub/app/web/azure-pipeline-formhub-frontend.yaml

Auto-trigger behavior:

- `features/*` commit triggers `dev` then `sit` deployment.
- After PR is approved and merged, commit on `main` triggers `uat` then `prd` deployment.
- Fee seeding runs based on a variable-group flag.
- `sit` approval should be configured in Azure DevOps Environment checks for environment `sit` (approver: Megha).

Backend fee seeding gate (per environment):

- Add `runFeeSeeding` in each variable group (`Integration-dev`, `Integration-sit`, `Integration-uat`, `Integration-prd`).
- Set `runFeeSeeding=true` only when you intentionally want to seed fee data.
- Seeding runs when `runFeeSeeding` is `true`.
- Keep `runFeeSeeding=false` for normal deployments to skip seeding.

Combined with infra deployment, this gives the 3-pipeline model:

- Infra deploy: ls-formshub/infra/infra-deploy.yaml
- Backend deploy: ls-formshub/app/azure-pipeline-formhub-backend.yaml
- Frontend deploy: ls-formshub/app/web/azure-pipeline-formhub-frontend.yaml

Legacy entry pipelines are still present and can be retired after validation:

- ls-formshub/app/az-ae-fa-formshub-functionapp/azure-pipeline-az-ae-fa-formshub-funcapp.yaml
- ls-formshub/app/logicApp/azure-pipeline-formhub-logicapps.yaml
- ls-formshub/app/web/azure-pipeline-az-ae-fa-formshub-staticapp .yaml

## Fee Data Seeding

Infrastructure creates storage and table schema. Fee values are seeded separately.

- Seed pipeline: ls-formshub/pipelines/storageAccount/azure-pipeline-formhub-feedata-storageaccount.yaml
- Seed scripts: ls-formshub/pipelines/storageAccount/seed-fee-rules-*.ps1

Current backend seeding runs 5 scripts:

- Registry forms (4 scripts, one per form/rule set):
  - ls-formshub/pipelines/storageAccount/seed-fee-rules-pcnew.ps1
  - ls-formshub/pipelines/storageAccount/seed-fee-rules-pcrenew.ps1
  - ls-formshub/pipelines/storageAccount/seed-fee-rules-pcvariation.ps1
  - ls-formshub/pipelines/storageAccount/seed-fee-rules-pcoriginal.ps1
- A2J/common form rules (1 script):
  - ls-formshub/pipelines/storageAccount/seed-fee-rules-cof.ps1
