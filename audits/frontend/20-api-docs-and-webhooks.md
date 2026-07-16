# 20 — API Docs & Webhooks

> **Source basis:** `src/features/api-docs/api-docs-client.tsx`, `src/features/api-docs/api-keys-manager.tsx`, `src/features/api-docs/webhooks-manager.tsx`, `src/features/api-docs/api-management-api.ts`  

---

## 20.1 API Docs Client (`src/features/api-docs/api-docs-client.tsx`)

### Route: `/{locale}/api-docs`

### Purpose
API documentation and developer tools (~10KB).

### Sections

**API Documentation:**
- Endpoint reference (REST API)
- Request/response examples
- Authentication guide
- Rate limiting info
- Error code reference

**API Keys Manager** (see §20.2)

**Webhooks Manager** (see §20.3)

### Layout
- Tabbed interface: Documentation, API Keys, Webhooks
- Documentation tab: rendered markdown or structured endpoint list
- Code examples with syntax highlighting
- Copy-to-clipboard buttons

---

## 20.2 API Keys Manager (`src/features/api-docs/api-keys-manager.tsx`)

### Purpose
Manage API keys for programmatic access (~11KB).

### Features

**Key List:**
- Table: name, key (masked), created date, last used, status (active/revoked)
- Create new key button
- Revoke key button (with confirmation)
- Copy key to clipboard
- Show/hide full key value

**Create Key Dialog:**
- Name input (descriptive label)
- Scope selection (read-only, read-write, admin)
- Expiration date (optional)
- On create: shows key ONCE with copy button and warning that it won't be shown again

**Security:**
- Keys are masked in the list (showing only first/last few characters)
- Full key shown only once at creation time
- Revocation is immediate and irreversible

### API Calls
| Function | Method | Path |
|----------|--------|------|
| `fetchApiKeys()` | GET | `/api-keys` |
| `createApiKey(data)` | POST | `/api-keys` |
| `revokeApiKey(id)` | DELETE | `/api-keys/{id}` |

---

## 20.3 Webhooks Manager (`src/features/api-docs/webhooks-manager.tsx`)

### Purpose
Manage webhook endpoints for event notifications (~14KB).

### Features

**Webhook List:**
- Table: URL, events subscribed, status (active/disabled), last delivery, success rate
- Create new webhook
- Edit webhook
- Delete webhook (with confirmation)
- Test webhook (send test event)
- View delivery history

**Create/Edit Webhook Dialog:**
- URL input (validated as URL)
- Event subscription checkboxes:
  - `screen.status_changed`
  - `media.uploaded`
  - `playlist.published`
  - `schedule.created`
  - `schedule.updated`
  - `subscription.updated`
  - `member.invited`
  - `member.joined`
- Secret token (for signature verification)
- Active/inactive toggle

**Delivery History:**
- List of recent webhook deliveries
- Status: success (2xx), failed (4xx/5xx), pending
- Request/response headers and body
- Timestamp
- Retry button for failed deliveries

### API Calls
| Function | Method | Path |
|----------|--------|------|
| `fetchWebhooks()` | GET | `/webhooks` |
| `createWebhook(data)` | POST | `/webhooks` |
| `updateWebhook(id, data)` | PATCH | `/webhooks/{id}` |
| `deleteWebhook(id)` | DELETE | `/webhooks/{id}` |
| `testWebhook(id)` | POST | `/webhooks/{id}/test` |
| `fetchDeliveries(webhookId)` | GET | `/webhooks/{id}/deliveries` |

---

## 20.4 API Management API (`src/features/api-docs/api-management-api.ts`)

Shared API module for both API keys and webhooks management. Uses `apiFetch` from session module for all requests with proper authentication and error handling.

---

## 20.5 [V2] UX Analysis — API Docs & Webhooks

### API Documentation — Developer UX

**[V2] In-App API Docs:**
Having API documentation inside the dashboard is convenient for developers — they don't need to navigate to a separate docs site. Key UX considerations:
- Code examples in multiple languages (curl, JavaScript, Python)
- Copy-to-clipboard for code snippets
- Interactive API explorer (try endpoints from the docs)
- Authentication guide (how to get API keys)
- Rate limiting documentation

**[V2] API Key Management:**
The `ApiKeysManager` component handles API key lifecycle. Key UX considerations:
- Key creation with name/description
- Key scope/permission selection
- Key display only once on creation (security best practice)
- Key revocation with confirmation
- Key last-used timestamp
- No key editing (keys are immutable after creation — correct for security)

**[V2] Webhook Management:**
The `WebhooksManager` handles webhook configuration. Key UX considerations:
- URL validation (must be HTTPS for production)
- Event type selection (which events trigger the webhook)
- Test webhook button (`POST /webhooks/{id}/test`)
- Delivery history (`GET /webhooks/{id}/deliveries`)
- Delivery status (success, failed, pending)
- Retry failed deliveries

**[V2] Webhook Delivery History:**
The delivery history is important for debugging webhook integrations. The UI should show:
- HTTP status code
- Response body (truncated)
- Timestamp
- Retry button for failed deliveries
- Filter by status (success/failed)

### [V2] Enterprise Developer Experience

**[V2] Missing API Features:**
- No API key rate limit display
- No API usage analytics
- No webhook signing secret display
- No webhook payload templates
- No API SDK downloads
- No API changelog
- No API status page
- No GraphQL alternative

### Cross-References
- See `06-auth-and-session.md` for API authentication
- See `17-notifications.md` for event types that could trigger webhooks
- See `23-error-handling-and-states.md` for API error handling
- See `28-feature-inventory.md` for API feature inventory
