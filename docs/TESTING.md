<!-- generated-by: gsd-doc-writer -->
# Testing — AI Based Navigation System

> **Current status:** No test suite has been configured for this project. This document describes the recommended testing setup, candidate frameworks, and testable units across both the backend (Flask) and frontend (React/Vite) codebases.

## Test framework and setup

The project currently has **no test framework installed** for either the backend or frontend. Below are the recommended frameworks and setup steps for each layer.

### Backend (Flask / Python)

- **Recommended framework:** [pytest](https://docs.pytest.org/) (>=7.0)
- **Recommended HTTP test client:** `pytest-flask` or Flask's built-in test client

**Setup:**

```bash
cd backend
pip install pytest pytest-flask
```

Create a `conftest.py` at the backend root to provide a test Flask app instance:

```python
import pytest
from app import create_app

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    return app.test_client()
```

### Frontend (React / Vite)

- **Recommended framework:** [Vitest](https://vitest.dev/) (natively compatible with the existing Vite config)
- **Recommended testing-library:** `@testing-library/react` (for component tests)

**Setup:**

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add a test script to `frontend/package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Configure Vitest in `frontend/vite.config.js`:

```js
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

Create `frontend/src/test/setup.js`:

```js
import '@testing-library/jest-dom'
```

## Running tests

### Backend

```bash
cd backend
pytest                          # Run all tests
pytest tests/                   # Run all tests in the tests/ directory
pytest tests/test_pathfinding.py  # Run a specific test file
pytest -v                       # Verbose output with individual test names
pytest -k "route"               # Run tests matching "route" in the name
```

### Frontend

```bash
cd frontend
npm test                        # Run all tests once (vitest run)
npm run test:watch              # Run tests in watch mode
npx vitest run src/pages/       # Run tests in a specific directory
npx vitest run --reporter=verbose  # Verbose output
```

## Writing new tests

### Backend naming convention

Place test files in a `backend/tests/` directory with the `test_` prefix:

```
backend/
├── tests/
│   ├── conftest.py            # Shared fixtures (app, client, mock DB)
│   ├── test_pathfinding.py    # Tests for pathfinding service
│   ├── test_geo_transform.py  # Tests for geo transform service
│   ├── test_navigation.py     # Tests for navigation API endpoint
│   ├── test_auth.py           # Tests for auth API endpoint
│   └── test_database.py       # Tests for database operations
```

**Example test — Backend service (`tests/test_pathfinding.py`):**

```python
import pytest
from app.services.pathfinding import calculate_shortest_path

def test_shortest_path_finds_direct_route():
    nodes = [{"id": "A"}, {"id": "B"}]
    edges = [{"from": "A", "to": "B", "weight": 1.0}]
    path = calculate_shortest_path(nodes, edges, "A", "B")
    assert path == ["A", "B"]

def test_shortest_path_returns_empty_on_no_path():
    nodes = [{"id": "A"}, {"id": "B"}]
    edges = []
    path = calculate_shortest_path(nodes, edges, "A", "B")
    assert path == []
```

**Example test — Backend API (`tests/test_navigation.py`):**

```python
def test_get_nodes_returns_404_for_unknown_building(client):
    response = client.get('/api/navigation/999/nodes')
    assert response.status_code == 200
    data = response.get_json()
    assert data['nodes'] == []
```

### Frontend naming convention

Place test files alongside their source files with a `.test.jsx` or `.test.js` suffix:

```
frontend/src/
├── pages/
│   ├── LandingPage.jsx
│   └── LandingPage.test.jsx    # Test for LandingPage
├── components/
│   └── ui/
│       ├── Map3D.jsx
│       └── Map3D.test.jsx      # Test for Map3D component
```

**Example test — Frontend component (`src/pages/LandingPage.test.jsx`):**

```jsx
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LandingPage from './LandingPage'

test('renders the landing page heading', () => {
  render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  )
  expect(screen.getByText(/AI Navigation/i)).toBeInTheDocument()
})
```

**Example test — Frontend utility logic:**

```js
import { describe, it, expect } from 'vitest'

describe('coordinate conversion', () => {
  it('converts 0-1000 pixel to -50..50 for Three.js', () => {
    const coord = 500
    const threeCoord = (coord - 500) / 10
    expect(threeCoord).toBe(0)
  })
})
```

### Key testable units

| Layer | Module / Component | What to test |
|-------|-------------------|--------------|
| Backend | `services/pathfinding.py` | Shortest path with valid graph, missing nodes, disconnected graph |
| Backend | `services/geo_transform.py` | Pixel-to-lat/lng and lat/lng-to-pixel accuracy, edge cases (0, 1000, missing anchor) |
| Backend | `services/qr_generator.py` | QR URL format, filename generation |
| Backend | `services/image_processor.py` | Gemini API call fallback to mock data when no API key |
| Backend | `api/navigation.py` | Route endpoint validation, line-of-sight intersection logic |
| Backend | `api/auth.py` | Login success (mock credentials), login failure |
| Backend | `api/blueprints.py` | Upload flow, blueprint retrieval, Gemini parsing fallback |
| Frontend | `pages/IndoorNavigation.jsx` | 3D map rendering, floor switcher interaction |
| Frontend | `pages/BlueprintUpload.jsx` | File upload flow, form validation |
| Frontend | `pages/AdminLogin.jsx` | Login form submission, error display |
| Frontend | `components/ui/Map3D.jsx` | Wall rendering from wall data, coordinate conversion |

## Coverage requirements

**No coverage threshold is currently configured.**

Once a test framework is installed, the following coverage configurations are recommended:

### Backend (pytest-cov)

```bash
pip install pytest-cov
```

Run with coverage:

```bash
pytest --cov=app --cov-report=term-missing --cov-report=html
```

Suggested minimum thresholds to add to `pytest.ini` or `setup.cfg`:

```ini
[tool:pytest]
addopts = --cov=app --cov-report=term-missing --cov-fail-under=70
```

### Frontend (Vitest)

Add to `frontend/vite.config.js`:

```js
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    thresholds: {
      lines: 70,
      branches: 60,
      functions: 70,
      statements: 70,
    },
  },
}
```

## CI integration

**No CI pipeline is currently configured.** The project has no `.github/workflows/` directory.

When CI is set up, the recommended workflow steps would be:

1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install pytest pytest-flask pytest-cov
   pytest --cov=app --cov-fail-under=70
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm ci
   npm run lint
   npm test
   ```

### End-to-end testing (future)

For end-to-end tests, consider:

- **[Playwright](https://playwright.dev/)** — Cross-browser E2E tests for the visitor navigation flow (scan QR → navigate building → view 3D map).
- **[Selenium](https://selenium.dev/)** — Alternative browser automation framework.

Key flows to cover with E2E:
1. Admin uploads a blueprint → system processes it → nodes/walls are persisted.
2. Visitor scans QR code → loads 3D map → requests route to a destination.
3. Admin logs in with mock credentials → navigates to dashboard → sees building list.
