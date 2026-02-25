

# Plan: Feyxa Infrastructure Engine — Event Bus & 5 Moteurs

## Contexte actuel

Aujourd'hui, la logique métier est dispersée : le checkout crée la commande, appelle l'escrow, envoie l'email, crée l'attribution — tout dans le même fichier `Checkout.tsx`. Les edge functions (confirm-delivery, escrow-auto-release) contiennent aussi de la logique en dur. Il n'y a pas de bus d'événements central, pas de retry, pas de suivi unifié des workflows.

---

## Architecture cible

```text
┌─────────────────────────────────────────────────────────┐
│                    EVENT BUS (events_log)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ order.*  │  │payment.* │  │delivery.*│  ...          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│  ┌────▼────┐   ┌─────▼────┐  ┌─────▼─────┐             │
│  │Commerce │   │ Fintech  │  │ Logistics │             │
│  │ Engine  │   │ Engine   │  │  Engine   │             │
│  └─────────┘   └──────────┘  └───────────┘             │
│       ┌────────────┐    ┌──────────────────┐           │
│       │ Trust &    │    │  Intelligence    │           │
│       │ Compliance │    │  Engine          │           │
│       └────────────┘    └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## Etape 1 — Base de données : Table `events_log`

Nouvelle table centrale pour tous les événements système :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK | Identifiant unique |
| `event_type` | text | Ex: `order.created`, `payment.paid` |
| `aggregate_type` | text | `order`, `payment`, `delivery`, `payout`, `ticket` |
| `aggregate_id` | uuid | ID de l'entité concernée |
| `store_id` | uuid | Boutique liée (nullable pour events admin) |
| `payload` | jsonb | Données de l'événement |
| `idempotency_key` | text UNIQUE | Clé pour éviter les doublons |
| `status` | text | `pending` → `processing` → `completed` / `failed` |
| `retry_count` | int | Nombre de tentatives |
| `max_retries` | int | Maximum de retries (défaut: 3) |
| `next_retry_at` | timestamptz | Prochaine tentative planifiée |
| `error_message` | text | Dernière erreur |
| `processed_at` | timestamptz | Date de traitement |
| `created_at` | timestamptz | Date de création |

Table `event_handlers_log` pour tracer chaque handler :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK | |
| `event_id` | uuid FK → events_log | |
| `handler_name` | text | Ex: `fintech.create_escrow`, `logistics.notify` |
| `status` | text | `success` / `failed` / `skipped` |
| `duration_ms` | int | Temps d'exécution |
| `error_message` | text | |
| `created_at` | timestamptz | |

RLS: lecture par store members + marketplace admins. Insertion via service_role uniquement.

---

## Etape 2 — Edge Function : `process-event`

Une edge function centrale qui :

1. Reçoit un event_type + payload
2. Génère l'idempotency_key (ex: `order.created:{order_id}`)
3. Insère dans `events_log` (skip si idempotency_key existe déjà)
4. Dispatch vers les handlers selon l'event_type
5. Log chaque handler dans `event_handlers_log`
6. Met à jour le statut de l'event

**Mapping V1 des handlers :**

| Event | Handlers déclenchés |
|-------|-------------------|
| `order.created` | `fintech.create_escrow`, `commerce.decrement_stock`, `commerce.send_confirmation_email`, `commerce.create_notification` |
| `payment.paid` | `fintech.update_payment_status`, `commerce.update_order_status` |
| `delivery.delivered` | `logistics.mark_delivered`, `fintech.release_escrow` |
| `delivery.confirmed` | `fintech.release_escrow`, `trust.audit_log` |
| `payout.requested` | `fintech.process_payout`, `trust.audit_log` |
| `ticket.created` | `trust.create_notification`, `trust.auto_assign` |

---

## Etape 3 — Edge Function : `retry-failed-events`

Cron job (toutes les 5 minutes) qui :
1. Sélectionne les events en `failed` avec `retry_count < max_retries` et `next_retry_at <= now()`
2. Réappelle `process-event` pour chaque
3. Incrémente retry_count, applique backoff exponentiel (5min, 15min, 45min)

---

## Etape 4 — Fonction helper `emit_event`

Fonction PostgreSQL `emit_event(_event_type, _aggregate_type, _aggregate_id, _store_id, _payload)` qui :
1. Insère dans `events_log`
2. Appelle `net.http_post` vers l'edge function `process-event`

Cette fonction sera appelée depuis :
- Le checkout (remplacer la logique inline)
- Les triggers de changement de statut
- Les edge functions existantes

---

## Etape 5 — Refactoring du Checkout

Simplifier `Checkout.tsx` : après l'insertion de la commande et des items, émettre un seul appel :

```typescript
await supabase.functions.invoke("process-event", {
  body: {
    event_type: "order.created",
    aggregate_id: orderId,
    store_id: storeId,
    payload: { order_number, total, currency, customer_email, items, payment_method }
  }
});
```

Tout le reste (escrow, email, attribution, notification, stock) sera géré par les handlers.

---

## Etape 6 — Dashboard Monitoring

Nouvelle page `DashboardInfraMonitor` (accessible admin uniquement) affichant :
- Events récents avec statut (pending/completed/failed)
- Taux de succès par type d'event
- Events en retry
- Filtres par type, statut, store
- Détail d'un event avec ses handler logs

---

## Détails techniques

- **Idempotency** : clé composite `{event_type}:{aggregate_id}` avec contrainte UNIQUE, empêchant les doublons
- **Retry avec backoff** : `next_retry_at = now() + (5 * 3^retry_count) minutes`
- **Timeout** : chaque handler a un timeout de 10s, loggé si dépassé
- **Sécurité** : `process-event` vérifie le JWT ou le service_role. `retry-failed-events` est appelé en cron avec service_role
- **Extensions requises** : `pg_net` (déjà activée pour le cron existant)

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Créer | Migration SQL (events_log, event_handlers_log, emit_event function) |
| Créer | `supabase/functions/process-event/index.ts` |
| Créer | `supabase/functions/retry-failed-events/index.ts` |
| Créer | `src/pages/AdminInfraMonitor.tsx` |
| Modifier | `src/pages/Checkout.tsx` (simplifier post-order logic) |
| Modifier | `supabase/functions/confirm-delivery/index.ts` (émettre event) |
| Modifier | `src/App.tsx` (ajouter route admin) |
| Modifier | `src/components/admin/AdminSidebar.tsx` (ajouter lien) |
| Modifier | `supabase/config.toml` (process-event, retry-failed-events) |

