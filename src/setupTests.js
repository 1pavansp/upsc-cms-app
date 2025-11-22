require('@testing-library/jest-dom'); // ensures matchers are loaded

// Mock Firebase
jest.mock('./firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}));

// Mock react-firebase-hooks
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [null, false]
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({})
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Note: individual tests may set their own `global.localStorage` mock.

// Keep `global.localStorage` and `window.localStorage` in sync so tests that set
// `global.localStorage = mock` will also affect `window.localStorage` used by
// browser code. This defines a proxy property on `global` that forwards to
// `window.localStorage`.
try {
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    get() {
      return window.localStorage;
    },
    set(val) {
      window.localStorage = val;
      return val;
    }
  });
} catch (e) {
  // ignore (non-writable environments)
}


