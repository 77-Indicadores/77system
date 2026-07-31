# Dominios

## Identity

Responsavel por usuarios e autenticacao.

Entidades:

- User
- Session
- PasswordResetToken
- UserStatus

## RBAC

Responsavel por papeis, permissoes e vinculo de usuarios a recursos.

Entidades:

- Role
- Permission
- UserRole
- ResourcePolicy

## Indicators

Responsavel por grupos, telas, widgets e contratos de dados para dashboards.

Entidades:

- DashboardGroup
- DashboardScreen
- Widget
- Metric
- DataContract

## Registries

Responsavel por CRUDs opcionais e personalizados por cliente.

Entidades:

- RegistryDefinition
- RegistryField
- RegistryRecord
- ImportJob
- ImportMapping

## Integrations

Responsavel por conectores externos.

Entidades:

- IntegrationConnection
- IntegrationCredential
- IntegrationDataset
- IntegrationJob
- IntegrationLog

## Data

Responsavel por staging, materializacao, refresh por cron e estado de freshness dos dados.

Entidades:

- DataSource
- DataRefreshSchedule
- DataSyncJob
- DataContractRegistry

## Exports

Responsavel por gerar Excel e PDF.

Entidades:

- ExportJob
- ExportTemplate
- ExportFile

## Super77

Nao deve ser um dominio com regra de negocio propria. Deve ser uma area tecnica que cruza outros dominios com permissoes elevadas.

Recursos acessiveis:

- Integracoes.
- Jobs.
- Logs.
- Configuracoes tecnicas.
- Diagnosticos.
- Feature flags.
