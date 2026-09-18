# Low-Level Design (LLD)

## 1. Module-Level Breakdown

```mermaid
flowchart LR
    subgraph Frontend[React Frontend]
        Login
        Register
        Dashboard
        Profile
        JobSearch
        JobDetails
        Recommendations
        Applications
    end

    subgraph Backend[Node.js Backend]
        AuthCtrl[auth.controller.js]
        UserCtrl[user.controller.js]
        SkillsCtrl[skills.controller.js]
        JobsCtrl[jobs.controller.js]
        AppsCtrl[applications.controller.js]
        RecCtrl[recommendations.controller.js]
        MLService[mlService.js]
        AuthMW[auth middleware]
        ErrMW[errorHandler middleware]
    end

    subgraph ML[Python ML Service]
        FlaskApp[app.py]
        Preprocess[preprocessing.py]
        Recommender[recommender.py]
        Eval[evaluation.py]
    end

    DB[(PostgreSQL)]

    Frontend -->|axios + JWT| AuthMW
    AuthMW --> AuthCtrl & UserCtrl & SkillsCtrl & JobsCtrl & AppsCtrl & RecCtrl
    AuthCtrl --> DB
    UserCtrl --> DB
    SkillsCtrl --> DB
    JobsCtrl --> DB
    AppsCtrl --> DB
    RecCtrl --> DB
    RecCtrl --> MLService
    MLService -->|HTTP POST /recommend| FlaskApp
    FlaskApp --> Preprocess
    FlaskApp --> Recommender
    Recommender --> Eval
```

## 2. Request Lifecycle — Protected Endpoint Example

Example: `PUT /api/users/me`

```mermaid
sequenceDiagram
    participant Client
    participant ExpressApp as app.js
    participant CORS as cors()
    participant JSONParser as express.json()
    participant AuthMW as auth middleware
    participant Controller as user.controller.js
    participant DB as PostgreSQL

    Client->>ExpressApp: PUT /api/users/me (Bearer token, JSON body)
    ExpressApp->>CORS: check origin
    CORS->>JSONParser: parse body into req.body
    JSONParser->>AuthMW: verify JWT
    alt token invalid/missing
        AuthMW-->>Client: 401 Unauthorized
    else token valid
        AuthMW->>Controller: req.user = {userId, email}
        Controller->>DB: UPDATE profiles ... WHERE user_id = $1
        DB-->>Controller: updated row
        Controller-->>Client: 200 { message, profile }
    end
```

## 3. Recommendation Pipeline — Class/Function-Level Detail

```mermaid
flowchart TD
    A["recommendations.controller.js<br/>getRecommendations()"] --> B["buildUserPayload(userId)<br/>-> {skills, education, experience, preferredRole, bio}"]
    A --> C["buildJobsPayload()<br/>-> [{jobId, title, description, category, skills}]"]
    B --> D["mlService.getRecommendations(payload)<br/>POST http://ml-service:6000/recommend"]
    C --> D
    D --> E["Flask app.py: /recommend"]
    E --> F["recommender.recommend_jobs(user, jobs, top_k)"]
    F --> G["preprocessing.build_user_profile_text(user)"]
    F --> H["preprocessing.build_job_text(job) for each job"]
    G --> I["TfidfVectorizer().fit_transform(corpus)"]
    H --> I
    I --> J["cosine_similarity(user_vector, job_vectors)"]
    J --> K["sort by score desc, take top_k"]
    K --> L["return [{jobId, score, matchedSkills}]"]
    L --> M["controller: enrich with job details + save snapshot to recommendations table"]
    M --> N["response to frontend: title, company, similarityScore, matchedSkills, reasons"]
```

## 4. Key Data Structures

**Payload sent from Node.js → Python ML service:**
```json
{
  "user": {
    "userId": 12,
    "skills": ["Python", "SQL", "Git"],
    "education": "B.Tech Computer Science",
    "experience": 1.5,
    "preferredRole": "Backend Developer",
    "bio": "Backend developer who enjoys building REST APIs."
  },
  "jobs": [
    {
      "jobId": 1,
      "title": "Backend Developer",
      "company": "TechNova Pvt Ltd",
      "description": "We are looking for a Python Backend Developer...",
      "category": "Backend",
      "skills": ["Python", "SQL", "REST API", "Docker"]
    }
  ],
  "topK": 5
}
```

**Response from Python ML service → Node.js:**
```json
{
  "recommendations": [
    { "jobId": 1, "score": 0.7891, "matchedSkills": ["Python", "SQL"] }
  ]
}
```

## 5. Error Handling Strategy

- Every async controller is wrapped in `asyncHandler()` so a thrown/rejected
  error is forwarded to Express's error-handling middleware (`next(err)`)
  instead of crashing the process.
- `errorHandler.js` is the single place that decides the HTTP status code and
  JSON error shape returned to the client (`{ error: "message" }`).
- If the ML service is unreachable, `mlService.js`'s `fetch` call throws, which
  bubbles up through `asyncHandler` to `errorHandler`, returning a `500` with a
  message like `ML service error (...)` — this is also the answer to the
  interview question *"what happens if the ML service goes down?"*.

## 6. Security Design Decisions

| Concern                        | Mitigation                                                        |
|----------------------------------|---------------------------------------------------------------------|
| Plain-text passwords             | bcrypt hash with salt (10 rounds) before storage                    |
| Unauthorized API access          | JWT required via `Authorization: Bearer <token>` + auth middleware  |
| Duplicate applications           | `UNIQUE(user_id, job_id)` DB constraint + application-level check   |
| SQL injection                    | All queries use parameterized `$1, $2...` placeholders (`pg` library), never string concatenation |
| Leaking which emails are registered | Login returns the same error for "no such user" and "wrong password" |
| Hardcoded secrets                | All secrets (DB password, JWT secret) come from environment variables, never committed to code |
| Cross-origin requests            | `cors()` middleware explicitly enabled on the backend               |
