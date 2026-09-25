# Forms Hub

Forms Hub is a web platform for submitting legal forms and handling payments.

## Repository Layout

```text
ls-formshub/
  app/        application code and app-level pipeline entry files
  pipelines/  Azure DevOps pipeline templates and seed scripts
  infra/      Bicep infrastructure definitions and infra deployment pipeline
```

## Documentation

### 📚 Main Documentation
- **[App and local development guide](ls-formshub/app/README.md)** - Application structure and local development
- **[Infrastructure and deployment guide](ls-formshub/infra/README.md)** - Bicep infrastructure and deployment


## Quick Links

| Need to... | See |
|------------|-----|
| Run the app locally | [app/README.md](ls-formshub/app/README.md) |
| Deploy infrastructure | [infra/README.md](ls-formshub/infra/README.md) |

## Testing & Security at a Glance

✅ **61 unit tests run automatically** in deployment pipelines:
- 35 React unit tests
- 26 Function App unit tests

✅ **Security scans** handled by Wiz branch policies:
- Vulnerability Scanner (npm & NuGet dependencies)
- Secret Scanner (hardcoded credentials)
- IaC Scanner (Bicep misconfigurations)
- SAST Scanner (code quality)
- Data Scanner (sensitive data)

✅ **Bicep what-if validation** runs before every infrastructure deployment to preview changes.
