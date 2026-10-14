# Car Wash System — Work Tracker

## UI Pages to Implement

### Dashboard
| Status | Page | Route |
|--------|------|-------|
| ✅ Done | Overview (stub) | `/dashboard` |
| ✅ Done | Create Job | `/dashboard/jobs/new` |
| ✅ Done | Jobs List | `/dashboard/jobs` |
| ✅ Done | Settings – Org | `/dashboard/settings/org` |
| ✅ Done | Settings – Members | `/dashboard/settings/members` |
| ⬜ | Job Detail / Edit | `/dashboard/jobs/[id]` |
| ✅ Done | Workers List | `/dashboard/workers` |
| ✅ Done | Worker Detail / Edit | `/dashboard/workers/[id]` |
| ✅ Done | Customers List | `/dashboard/customers` |
| ✅ Done | Customer Detail / Edit | `/dashboard/customers/[id]` |
| ⬜ | Services List | `/dashboard/services` |
| ⬜ | Service Detail / Edit | `/dashboard/services/[id]` |
| ⬜ | Billing – Payments | `/dashboard/billing` |
| ⬜ | Billing – Expenses | `/dashboard/billing/expenses` |
| ⬜ | Billing – Commissions | `/dashboard/billing/commissions` |
| ⬜ | Reports | `/dashboard/reports` |

### Auth (already built)
| Status | Page | Route |
|--------|------|-------|
| ✅ Done | Login | `/login` |
| ✅ Done | Register | `/register` |
| ✅ Done | Forgot / Reset Password | `/reset-password` |
| ✅ Done | Verify Email | `/verify-email` |
| ✅ Done | Accept Invitation | `/organizations/invitations/[token]/accept` |
| ✅ Done | Decline Invitation | `/organizations/invitations/[token]/decline` |

---

## APIs per UI Page

### Jobs
| Page | API Endpoints |
|------|--------------|
| Jobs List | `GET /api/jobs/` |
| Create Job | `POST /api/jobs/` · `POST /api/jobs/items/` |
| Job Detail / Edit | `GET /api/jobs/{id}/` · `PATCH /api/jobs/{id}/` · `DELETE /api/jobs/{id}/` · `GET /api/jobs/items/?job={id}` · `POST/PATCH/DELETE /api/jobs/items/{id}/` |

### Workers
| Page | API Endpoints |
|------|--------------|
| Workers List | `GET /api/workers/` |
| Worker Detail / Edit | `GET /api/workers/{id}/` · `PATCH /api/workers/{id}/` · `DELETE /api/workers/{id}/` |

### Customers
| Page | API Endpoints |
|------|--------------|
| Customers List | `GET /api/customers/` |
| Customer Detail / Edit | `GET /api/customers/{id}/` · `PATCH /api/customers/{id}/` · `DELETE /api/customers/{id}/` |
| — (sub-resource) | `GET /api/customers/vehicles/?customer={id}` · `POST /api/customers/vehicles/` · `PATCH/DELETE /api/customers/vehicles/{id}/` |

### Services
| Page | API Endpoints |
|------|--------------|
| Services List | `GET /api/services/` |
| Service Detail / Edit | `GET /api/services/{id}/` · `PATCH /api/services/{id}/` · `DELETE /api/services/{id}/` |
| — (pricing) | `GET /api/services/prices/?service={id}` · `POST /api/services/prices/` · `PATCH/DELETE /api/services/prices/{id}/` |

### Billing
| Page | API Endpoints |
|------|--------------|
| Payments | `GET /api/billing/payments/` · `POST /api/billing/payments/` · `PATCH/DELETE /api/billing/payments/{id}/` |
| Expenses | `GET /api/billing/expenses/` · `POST /api/billing/expenses/` · `PATCH/DELETE /api/billing/expenses/{id}/` |
| Commissions | `GET /api/billing/commission-entries/` · `GET /api/billing/commission-payouts/` · `POST /api/billing/commission-payouts/` |

### Reports
| Page | API Endpoints |
|------|--------------|
| Reports | `GET /api/reports/` _(not yet implemented on backend)_ |

### Settings (already wired)
| Page | API Endpoints |
|------|--------------|
| Org Settings | `GET/PATCH /api/commons/businesses/{id}/` |
| Members | `GET /api/commons/branches/` · org invite/remove/role endpoints |

### Auth (already wired)
| Page | API Endpoints |
|------|--------------|
| Login | `POST /api/users/token/` |
| Register | `POST /api/users/` |
| Refresh token | `POST /api/users/token/refresh/` |
| Forgot Password | `POST /api/users/auth/forgot-password/` |
| Reset Password | `POST /api/users/auth/reset-password/` |
