# DevPilot AI - Developer Frontend

Modern, responsive, developer-assistant interface for DevPilot AI. Connects to the Spring Cloud API Gateway (port 8080) to orchestrate multi-agent software engineering tasks across Research, Planning, Coding, Approved Testing, and Documentation.

---

## 🛠 Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 6 / 8 with proxy configured to API Gateway (`http://localhost:8080`)
- **Routing**: React Router DOM v7 (`react-router-dom`)
- **HTTP Client**: Axios with automatic JWT Bearer token injection and HTTP 401 session expiry handling
- **Styling**: Tailwind CSS v3.4 + PostCSS with high-contrast developer console dark aesthetic
- **Icons**: Lucide React
- **Test Suite**: Vitest + React Testing Library + `@testing-library/jest-dom` + `jsdom`

---

## 📂 Project Structure

```text
frontend/
├── src/
│   ├── api/
│   │   ├── apiClient.js       # Central Axios client, Bearer injection, 401 interceptor
│   │   ├── authApi.js         # Register, login, and health check endpoints
│   │   └── taskApi.js         # Task creation, detail fetching, list, and cancellation
│   ├── components/
│   │   ├── AlertBanner.jsx    # Dismissible alerts for errors, warnings, and notifications
│   │   ├── EmptyState.jsx     # User-friendly empty state screens with action buttons
│   │   ├── Footer.jsx         # Architecture footer showing service ports
│   │   ├── LoadingSpinner.jsx # Accessible animated loading indicator
│   │   ├── Navbar.jsx         # Header navigation, gateway status pill, profile chip
│   │   ├── ProgressBar.jsx    # Animated progress bar with percentage and step labels
│   │   ├── ProtectedRoute.jsx # Route guard redirecting unauthenticated users to /login
│   │   ├── StatusBadge.jsx    # Color-coded status badges for all task lifecycle states
│   │   ├── TerminalViewer.jsx # Syntax-highlighted console output viewer for test logs
│   │   └── WorkflowTimeline.jsx # Visual multi-stage workflow stepper
│   ├── context/
│   │   └── AuthContext.jsx    # React Context for auth state, login/register, logout
│   ├── pages/
│   │   ├── AuthPage.jsx       # Login and Registration tabbed form with client validations
│   │   ├── DashboardPage.jsx  # Task overview, metrics, search/filtering, and cards
│   │   ├── NewTaskPage.jsx    # Software change description form with constraints
│   │   ├── TaskDetailPage.jsx # Full task details: bounded polling, research, diffs, tests, docs
│   │   └── NotFoundPage.jsx   # HTTP 404 page
│   ├── utils/
│   │   ├── dateUtils.js       # Timestamp, relative time, and duration formatting
│   │   └── tokenStorage.js    # Documented JWT storage strategy & security isolation
│   ├── test/
│   │   ├── setup.js           # Jest-DOM matchers setup for Vitest
│   │   ├── auth.test.jsx      # Login/register client validation and token storage tests
│   │   ├── dashboard.test.jsx # Dashboard metrics, filtering, and empty state tests
│   │   ├── newTask.test.jsx   # Task submission and constraint tests
│   │   └── taskDetail.test.jsx# Detail tabs, terminal output, and polling tests
│   ├── App.jsx                # Main layout and route definitions
│   ├── index.css              # Tailwind CSS directives & scrollbar styling
│   └── main.jsx               # Application bootstrap
├── index.html                 # HTML template with DevPilot branding
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind configuration
└── vite.config.js             # Vite config with API Gateway proxy and test runner
```

---

## 🔒 Authentication & Token Strategy

### Strategy & Security Rationale

1. **JWT Bearer Token Architecture**:
   - The DevPilot microservice architecture uses cryptographic JWT tokens issued by the Auth Service (port 8081) and validated by the API Gateway (port 8080).
   - Because the backend returns tokens directly in the JSON response payload (`{ token, tokenType: "Bearer", expiresIn }`), the frontend stores the token and its computed expiration timestamp in `localStorage`.
   - **Trade-off Analysis**:
     - *Advantages*: Immune to Cross-Site Request Forgery (CSRF) without requiring CSRF token synchronizers, since browsers never send `localStorage` contents implicitly.
     - *Mitigations for XSS*: Passwords are never saved in storage or React state after the single authentication request. React's JSX compiler automatically escapes values before rendering.
2. **Identity Verification (No Client-Supplied User IDs)**:
   - The frontend **never** generates, supplies, or trusts client-side user identifiers or `X-Authenticated-User` headers.
   - The API Gateway's `JwtAuthenticationFilter` validates the signature against the HMAC-SHA secret, extracts the authenticated `subject` claim (the user's email), strips any client header, and injects `X-Authenticated-User: <verified-user>` into downstream requests.
3. **Session Expiry & 401/403 Handling**:
   - An Axios response interceptor (`src/api/apiClient.js`) captures HTTP 401 Unauthorized responses.
   - Upon session expiration, tokens are purged immediately from storage, and a custom event (`devpilot:session_expired`) triggers an informative warning on the login page ("Your session has expired. Please log in again.").

---

## 🚀 Running the Frontend

### Prerequisites

- Node.js `>= 18.0.0` (Tested on Node v24.15.0)
- npm `>= 9.0.0` (Tested on npm 11.12.1)
- Backend services running on ports:
  - **Eureka Server**: `8761`
  - **Auth Service**: `8081`
  - **AI Orchestrator**: `8084`
  - **API Gateway**: `8080`

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (runs on http://localhost:5173)
npm run dev

# 3. Run the automated test suite
npm run test

# 4. Build optimized production bundle
npm run build

# 5. Preview the production build locally
npm run preview
```

---

## 🌐 API Gateway Proxy Configuration

In `vite.config.js`, all `/api` requests are proxied directly to the API Gateway:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

This eliminates browser CORS discrepancies in development while allowing direct production deployments using `VITE_API_BASE_URL`.
