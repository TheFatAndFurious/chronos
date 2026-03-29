# Chronos — Event-Sourced Financial Ledger

## Vue d'ensemble

Chronos est un ledger financier construit sur les patterns **Event Sourcing** et **CQRS**.
L'état n'est jamais stocké directement — il est toujours reconstruit depuis une séquence d'événements immuables.
Projet d'apprentissage solo, durée estimée 2-3 semaines, API uniquement (pas de front-end).

---

## Stack technique

| Couche           | Technologie              |
| ---------------- | ------------------------ |
| Runtime          | Bun                      |
| Framework HTTP   | Elysia                   |
| Langage          | TypeScript (strict)      |
| Event Store      | PostgreSQL (append-only) |
| Read Model cache | Redis                    |
| Tests de charge  | k6                       |
| Tests            | Bun test runner          |

---

## Principes fondamentaux — à ne jamais violer

1. **La table `events` est append-only** — jamais de UPDATE, jamais de DELETE
2. **Le solde n'est jamais stocké en base SQL** — il est calculé depuis les events et mis en cache dans Redis
3. **`account_projections` est une vue dérivée** — elle peut être reconstruite entièrement depuis les events à tout moment
4. **Un compte existe si et seulement si un event `AccountCreated` existe pour son `aggregate_id`**
5. **Toute opération financière retourne un `transactionId` traçable**
6. **Les montants sont des entiers en centimes** — jamais de float

---

## Architecture CQRS

### Command Side (écriture)

- Valide la commande
- Charge l'aggregate (snapshot + events suivants)
- Applique la logique métier
- Appende le(s) event(s) via `EventStore`
- Invalide le cache Redis
- Retourne uniquement un `transactionId`

### Query Side (lecture)

- Consulte Redis en premier (cache hit → réponse immédiate)
- Si cache miss → charge snapshot + events depuis PostgreSQL → reconstruit l'état → met en cache
- Ne passe jamais par la logique métier

---

## Structure des dossiers

```
src/
├── domain/                    # Logique métier pure — aucune dépendance externe
│   ├── aggregates/
│   │   └── account.aggregate.ts
│   ├── events/
│   │   └── domain-events.ts   # Types de tous les events
│   └── exceptions/
│       └── domain.exceptions.ts
├── application/               # Command Handlers et Query Handlers
│   ├── commands/
│   │   ├── create-account.handler.ts
│   │   ├── deposit.handler.ts
│   │   ├── withdraw.handler.ts
│   │   └── transfer.handler.ts
│   └── queries/
│       ├── get-balance.handler.ts
│       └── get-transactions.handler.ts
├── infrastructure/            # Implémentations concrètes (DB, Redis, etc.)
│   ├── persistence/
│   │   ├── event-store.ts
│   │   ├── snapshot.repository.ts
│   │   └── account-projection.repository.ts
│   ├── cache/
│   │   └── redis.cache.ts
│   ├── workers/
│   │   └── snapshot.worker.ts
│   └── auth/
│       ├── jwt.service.ts
│       └── token.repository.ts
└── http/                      # Couche Elysia — routing et controllers
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── accounts.routes.ts
    │   └── transactions.routes.ts
    └── middleware/
        └── auth.middleware.ts
```

---

## Schéma de base de données

### Table `events` (source de vérité absolue)

```sql
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id  UUID NOT NULL,
  version       INTEGER NOT NULL,
  type          VARCHAR NOT NULL,
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aggregate_id, version)  -- optimistic locking
);
```

### Table `snapshots`

```sql
CREATE TABLE snapshots (
  aggregate_id  UUID PRIMARY KEY,
  version       INTEGER NOT NULL,
  state         JSONB NOT NULL,  -- { balance: 2340 }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table `account_projections` (read model)

```sql
CREATE TABLE account_projections (
  account_id    UUID PRIMARY KEY,
  owner_name    VARCHAR NOT NULL,
  status        VARCHAR NOT NULL DEFAULT 'active',  -- active | closed
  created_at    TIMESTAMPTZ NOT NULL
);
```

### Table `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  token_hash    VARCHAR NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR NOT NULL
  email         VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Types des événements métier

```typescript
type AccountCreated = {
  type: "AccountCreated";
  payload: { ownerName: string };
};

type MoneyDeposited = {
  type: "MoneyDeposited";
  payload: { amount: number; transactionId: string };
};

type MoneyWithdrawn = {
  type: "MoneyWithdrawn";
  payload: { amount: number; transactionId: string };
};

type MoneyTransferredOut = {
  type: "MoneyTransferredOut";
  payload: { amount: number; targetAccountId: string; transferId: string };
};

type MoneyTransferredIn = {
  type: "MoneyTransferredIn";
  payload: { amount: number; sourceAccountId: string; transferId: string };
};

type DomainEvent =
  | AccountCreated
  | MoneyDeposited
  | MoneyWithdrawn
  | MoneyTransferredOut
  | MoneyTransferredIn;
```

---

## Décisions d'architecture (ADR)

| ADR     | Décision                                         | Raison                                                                                   |
| ------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| ADR-001 | Elysia sur Bun                                   | JWT natif, validation de body, inférence de types — économie de 4-5 jours vs Bun vanilla |
| ADR-002 | Snapshot Worker via LISTEN/NOTIFY PostgreSQL     | Découplé du Command side, réactif, zéro infrastructure supplémentaire                    |
| ADR-003 | JSONB pour le payload des events                 | Schéma stable, modèle naturel de l'Event Sourcing, validation assurée par TypeScript     |
| ADR-004 | Invalidation totale du cache Redis               | Simple, garantie absolue de fraîcheur — hybride TTL en bonus si le temps le permet       |
| ADR-005 | Migration PostgreSQL → EventStoreDB en semaine 3 | Comprendre les abstractions avant de les utiliser                                        |

---

## Snapshot Worker

- **Déclencheur** : LISTEN/NOTIFY PostgreSQL via trigger sur INSERT dans `events`
- **Seuil** : 100 events depuis le dernier snapshot (configurable via `SNAPSHOT_THRESHOLD` env)
- **Logique** : `version_courante - version_dernier_snapshot >= SNAPSHOT_THRESHOLD`
- **Idempotence** : INSERT protégé par `WHERE version = $expected` — deux workers simultanés ne corrompent pas les données
- **Scope** : par aggregate — chaque compte a son propre compteur indépendant

---

## Cache Redis

### Clés

```
balance:{accountId}              → solde calculé (invalidation immédiate après chaque event)
transactions:{accountId}:{page}  → historique paginé (invalidation totale)
```

### Stratégie d'invalidation

Après chaque append d'event sur un aggregate, toutes les clés Redis de cet aggregate sont supprimées.
L'amélioration hybride (invalidation sélective + TTL sur l'historique) est en bonus semaine 3.

---

## Authentification

- **Access token** : JWT, TTL 15 minutes, signé avec `JWT_SECRET`
- **Refresh token** : UUID aléatoire, TTL 7 jours, stocké hashé en base, rotation à chaque refresh
- **Logout** : révocation du refresh token en base — les access tokens existants expirent naturellement
- **Protection** : tous les endpoints UC-01 à UC-08 requièrent un Bearer token valide

---

## Optimistic Locking

Le problème : deux requêtes lisent le même état (version = 5), calculent toutes les deux une action valide, et tentent toutes les deux d'insérer la version 6.

La solution : la contrainte `UNIQUE(aggregate_id, version)` rejette le deuxième INSERT. Le caller reçoit une erreur `OptimisticLockException` et doit réessayer depuis le début.

```typescript
class OptimisticLockException extends Error {
  constructor(aggregateId: string, expectedVersion: number) {
    super(
      `Optimistic lock failed for aggregate ${aggregateId} at version ${expectedVersion}`,
    );
  }
}
```

---

## Use Cases

| ID     | Endpoint                                 | Description            | Auth |
| ------ | ---------------------------------------- | ---------------------- | ---- |
| UC-00  | POST /auth/register                      | Créer un utilisateur   | Non  |
| UC-00b | POST /auth/login                         | Se connecter           | Non  |
| UC-00c | POST /auth/refresh                       | Rafraîchir le token    | Non  |
| UC-00d | POST /auth/logout                        | Se déconnecter         | Oui  |
| UC-01  | POST /accounts                           | Créer un compte        | Oui  |
| UC-02  | GET /accounts/:id                        | Consulter un compte    | Oui  |
| UC-03  | POST /accounts/:id/deposit               | Déposer de l'argent    | Oui  |
| UC-04  | POST /accounts/:id/withdraw              | Retirer de l'argent    | Oui  |
| UC-05  | POST /transfers                          | Effectuer un virement  | Oui  |
| UC-06  | GET /accounts/:id/balance                | Consulter le solde     | Oui  |
| UC-07  | GET /accounts/:id/transactions           | Historique paginé      | Oui  |
| UC-08  | GET /accounts/:id/transactions?from=&to= | Historique par période | Oui  |

---

## SLO (Service Level Objectives)

| Endpoint                 | Cible P95 | Condition       |
| ------------------------ | --------- | --------------- |
| GET /balance             | < 50ms    | Cache Redis hit |
| GET /balance             | < 200ms   | Cache miss      |
| GET /transactions        | < 200ms   | Cache miss      |
| POST /deposit, /withdraw | < 300ms   | Charge normale  |
| POST /transfers          | < 500ms   | 2 aggregates    |

- Taux d'erreurs 5xx : < 1% sous charge normale
- Exactitude : solde Redis = solde recalculé depuis events (invariant absolu)

---

## Approche TDD

Le projet suit une approche **Outside-In hybride** :

1. **Test d'intégration** du use case (Command Handler + EventStore réel) — point d'entrée
2. Il échoue → identifier les briques manquantes
3. **Tests unitaires** sur chaque brique (Aggregate, EventStore, Repository)
4. Remonter au test d'intégration → il doit passer
5. **Test E2E HTTP** en dernier pour valider le contrat API

Structure des tests avec style BDD :

```typescript
it("should append a MoneyDeposited event", async () => {
  // Given
  // When
  // Then
});
```

---

## Variables d'environnement

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chronos
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_ACCESS_TTL=900        # 15 minutes en secondes
JWT_REFRESH_TTL=604800    # 7 jours en secondes
SNAPSHOT_THRESHOLD=100    # Nombre d'events avant création d'un snapshot
PORT=3000
```

---

## Conventions de code

- **Nommage des events** : PascalCase, passé composé — `MoneyDeposited`, `AccountCreated`
- **Nommage des commandes** : PascalCase, infinitif — `DepositMoney`, `CreateAccount`
- **Montants** : toujours en centimes (entiers) — `500` = 5,00€
- **IDs** : UUID v4 partout
- **Erreurs domaine** : classes dédiées étendant `Error` — jamais de strings brutes
- **Pas de `any`** — TypeScript strict activé

---

## Planning

| Semaine | Focus                  | Objectif                                              |
| ------- | ---------------------- | ----------------------------------------------------- |
| 1       | Command Side           | Event Store + Optimistic Locking + UC-00 à UC-05      |
| 2       | Query Side             | Redis + Snapshot Worker LISTEN/NOTIFY + UC-06 à UC-08 |
| 3       | Migration & Validation | PostgreSQL → EventStoreDB + Tests k6 + SLO            |
