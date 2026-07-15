# ats-api

API REST do sistema **ATS — Acompanhamento de Transportes e Equipamentos**, desenvolvido para o Ministério da Saúde (DECAN/MS).

---

## Stack

| Tecnologia | Versão |
|---|---|
| NestJS | 11.x |
| TypeORM | latest |
| PostgreSQL | 16 |
| TypeScript | 5.x |
| passport-jwt | 4.x |
| bcrypt | 6.x |
| nodemailer | 9.x |
| @nestjs/schedule | 6.x |

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 16 (ou Docker — veja abaixo)

---

## Configuração

### 1. Variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `2001` | Porta do servidor |
| `DB_HOST` | — | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USERNAME` | — | Usuário do banco |
| `DB_PASSWORD` | — | Senha do banco |
| `DB_DATABASE` | — | Nome do banco |
| `JWT_SECRET` | — | **Obrigatório.** String aleatória ≥ 32 chars. Gere com `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `30m` | Duração do token JWT |
| `HASH_AMOUNT` | `12` | Rounds do bcrypt para hash de senhas |
| `SWAGGER_ENABLED` | `false` | Ativa documentação Swagger em `/api` |
| `CORS_ORIGIN` | `http://localhost:3000` | Domínio do frontend (obrigatório em produção) |
| `MAIL_HOST` | — | Servidor SMTP |
| `MAIL_PORT` | `587` | Porta SMTP |
| `MAIL_SECURE` | `false` | TLS/SSL no SMTP |
| `MAIL_USER` | — | Usuário SMTP |
| `MAIL_PASS` | — | Senha SMTP |
| `MAIL_FROM_NAME` | `Sistema ATS` | Nome exibido no remetente |
| `SEND_EMAIL` | `false` | `true` para enviar e-mails de verdade |

### 2. Banco de dados com Docker

```bash
docker-compose up -d
```

Isso sobe um PostgreSQL 16 na porta 5432 com:
- Usuário: `postgres`
- Senha: `postgres`
- Banco: `ats`

---

## Rodando localmente

```bash
npm install
npm run start:dev
```

A API sobe em `http://localhost:2001`.

Se `SWAGGER_ENABLED=true`, a documentação fica em `http://localhost:2001/api`.

---

## Migrations e Seed

```bash
# Gerar uma migration a partir das entidades
npm run migration:generate -- src/database/migrations/NomeDaMigration

# Rodar migrations pendentes
npm run migration:run

# Popular o banco com dados iniciais
npm run seed:run
```

---

## Testes

```bash
npm test            # Todos os testes
npm run test:cov    # Com cobertura
```

---

## Estrutura do projeto

```
src/
├── app.module.ts
├── main.ts
├── common/
│   └── mail/
│       ├── mail.service.ts        # Wrapper nodemailer
│       └── mail.templates.ts      # Templates HTML e texto de e-mail
├── database/
│   ├── migrations/                # Migrations TypeORM
│   └── seed/                      # Dados iniciais
├── modules/
│   ├── auth/                      # JWT, guards, RBAC
│   │   ├── auth.controller.ts     # POST /auth/login|logout|refresh, GET /auth/me
│   │   ├── auth.service.ts        # Login, refresh, geração de token
│   │   ├── auth.repository.ts     # Consultas ao banco de usuários
│   │   ├── entities/user.entity.ts
│   │   ├── guards/                # JwtAuthGuard, ModuleGuard, CompanyScopeGuard
│   │   ├── strategies/jwt.strategy.ts
│   │   └── services/token-blocklist.service.ts
│   ├── role/                      # Papéis e módulos RBAC
│   ├── company/                   # Cadastro de empresas (fornecedores)
│   ├── hospital/                  # Hospitais, combo-consult, combo-equipamento
│   ├── empresa/                   # Módulo empresa (gestor/admin)
│   │   ├── empresa.service.ts
│   │   ├── empresa-lock.service.ts    # Lock de edição com TTL de 5 min
│   │   ├── empresa-problem.service.ts # Registro de problemas por empresa
│   │   └── empresa-admin.service.ts   # Gestão de usuários e empresas
│   ├── distribuicao/              # Distribuição RTx e TRS
│   ├── entrega/                   # Entrega RTx e TRS
│   ├── cota-geral/                # Cota Geral de veículos
│   ├── consolidado/               # Visão consolidada
│   ├── rnm-doc/                   # Documentos RNM
│   └── email/                     # Serviço de e-mail (wrapper)
└── utils/
    └── payload.ts                 # Validação de payload de entrada
```

---

## Autenticação

O sistema usa **JWT via cookie HttpOnly** (sem localStorage). O fluxo é:

1. `POST /auth/login` — autentica e define o cookie `jwt`
2. `GET /auth/me` — retorna dados do usuário a partir do token existente
3. `POST /auth/refresh` — renova o cookie (sessão deslizante de 30 min)
4. `POST /auth/logout` — revoga o token e limpa o cookie

O RBAC é dinâmico: cada `Role` possui `RoleModule[]` que define quais módulos o usuário acessa e se tem permissão de escrita.

---

## Lock de edição

Registros de combo (`combo_consult`) podem ser bloqueados para edição por um usuário por vez. O lock expira automaticamente em **5 minutos** via CRON (`@nestjs/schedule`). Desbloqueio manual disponível via `DELETE /empresa/relatorio/:id/lock`.

---

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Usuário atual |
| POST | `/auth/refresh` | Renovar sessão |
| POST | `/auth/logout` | Logout |
| GET | `/distribuicao` | Distribuição RTx e TRS |
| GET | `/entrega` | Entrega RTx e TRS |
| GET | `/cota-geral` | Cota Geral |
| GET | `/consolidado` | Visão consolidada |
| GET | `/empresa/relatorio` | Relatório da empresa logada |
| GET | `/empresa/gestor/admin/companies` | Lista empresas (admin) |
| GET | `/hospital/combo` | Combos de equipamentos |
| GET | `/roles` | Lista de papéis RBAC |
