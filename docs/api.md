# API overview

Interactive OpenAPI: `http://127.0.0.1:8000/docs`

All mutating domain endpoints require `Authorization: Bearer <jwt>`.

## Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | Roles: `student`, `organization`. Rate limited. |
| POST | `/api/auth/login` | Returns JWT. Rate limited. |
| GET | `/api/auth/me` | Includes nested student or organization profile. |
| POST | `/api/auth/logout` | Client discards token. |

## Students, internships, applications

| Method | Path |
| --- | --- |
| GET/PUT | `/api/students/me` |
| POST | `/api/students/resume` |
| POST | `/api/students/resume/confirm` |
| GET | `/api/students/me/applications` |
| GET | `/api/students/me/allocations` |
| POST/GET | `/api/internships` |
| GET/PUT/DELETE | `/api/internships/{id}` |
| POST | `/api/applications` |
| GET | `/api/applications/internship/{id}` |

## Engines

| Method | Path |
| --- | --- |
| POST | `/api/eligibility/check` |
| POST | `/api/matching/calculate` |
| GET | `/api/matching/student/{id}` |
| POST | `/api/allocation/run` |
| POST | `/api/allocation/rounds/{id}/publish` |
| POST | `/api/allocation/rounds/{id}/simulate` |
| POST | `/api/allocation/reallocate` |
| POST | `/api/allocation/reject` |

## Admin

Dashboard, CSV export (`/api/admin/export/{students|applications|allocations|internships|audit}`), matching weights, allocation policy, organization approval, demo reset.

Health: `GET /api/health`.
