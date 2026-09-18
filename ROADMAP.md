# 🗺 Roadmap — Personalized Job Recommendation Platform

This roadmap is organized in phases. Phase 0 is complete and verified working end-to-end (auth → skills → recommendations → applications). Phases 1–4 are prioritized by what unblocks real usage fastest.

---

## Phase 0 — Core Platform ✅ Done

| Feature | Status |
|---|---|
| User registration & login (JWT + bcrypt) | ✅ |
| Profile management (education, experience, bio, preferred role) | ✅ |
| Skills management (add/remove, master skill list) | ✅ |
| Job search & filtering (skill, title, location, experience, pagination) | ✅ |
| Job applications (apply, list mine, duplicate guard) | ✅ |
| ML-powered recommendations (TF-IDF + cosine similarity) | ✅ |
| Explainable recommendations ("why this job") | ✅ |
| Docker Compose orchestration (4 services) | ✅ |
| Fixed: ML service port conflict (6000 → 6100) | ✅ |

---

## Phase 1 — Hardening 🔜 Next

Focus: close the gaps that matter before more people touch this.

| Item | Why it matters |
|---|---|
| Ownership check on `PUT /api/applications/:id` | Currently any logged-in user can change *any* application's status |
| Add a `role` column (`applicant` / `recruiter` / `admin`) | Needed to gate recruiter-only actions (`createJob`, `updateApplicationStatus`) |
| Deduplicate/expire old rows in `recommendations` table | Table currently grows unbounded — one row per call |
| Input validation (`express-validator` is already a dependency but unused) | Prevent malformed payloads reaching the DB layer |
| Rate limiting on `/api/auth/*` | Basic brute-force protection |
| Centralized request logging | Makes debugging issues like the port bug faster next time |

---

## Phase 2 — Smarter Recommendations 📋 Planned

Focus: improve match quality beyond plain TF-IDF.

| Item | Description |
|---|---|
| Weighted skill matching | Give exact skill overlap more influence than free-text similarity alone |
| Experience-level filtering | Penalize/boost jobs based on `experience_required` vs. user's `experience_years` |
| Location-aware ranking | Optional boost for jobs near the user's stated location |
| Feedback loop | Let users mark recommendations as relevant/not relevant; feed this back into scoring |
| A/B evaluation harness | `ml-service/evaluation.py` and `run_experiments.py` already exist as a baseline — extend with Precision@K / Recall@K tracking over time |

---

## Phase 3 — Recruiter-Side Features 📋 Planned

Focus: make this a two-sided platform, not just job-seeker facing.

| Item | Description |
|---|---|
| Recruiter dashboard | Post/edit/close jobs from the UI (backend endpoints already exist) |
| Applicant tracking view | See + filter applicants per job, update statuses in bulk |
| Company/organization accounts | Group jobs under a company profile |
| Notifications | Email or in-app notification when application status changes |

---

## Phase 4 — Production Readiness 📋 Planned

Focus: what it takes to actually deploy and operate this.

| Item | Description |
|---|---|
| CI pipeline | Run `backend/tests/api.test.js` and ML unit tests on every PR |
| Environment-based config | Separate `.env` per environment (dev/staging/prod), secrets via a vault, not `.env` files |
| Managed Postgres + backups | Move off the local Docker volume |
| Health checks + monitoring | Wire `/health` endpoints into uptime monitoring; add structured logging |
| HTTPS + reverse proxy | Nginx/Caddy in front of frontend + backend |
| Horizontal scaling of ML service | Stateless Flask app — trivial to run multiple replicas behind a load balancer if traffic grows |

---

## Suggested Order of Attack

If presenting this as a project timeline:

1. **Week 1–2:** Phase 1 (hardening) — makes the app safe to actually let more than one trusted user touch
2. **Week 3–4:** Phase 2 (smarter recommendations) — the core value proposition gets measurably better
3. **Week 5–6:** Phase 3 (recruiter side) — unlocks the platform being genuinely two-sided
4. **Week 7+:** Phase 4 (production readiness) — only needed once you're ready for real traffic
