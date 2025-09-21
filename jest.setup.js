import '@testing-library/jest-dom'

// Polyfill fetch for tests
global.fetch = jest.fn()

// Provide a minimal Request mock for Next.js server imports
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {}
  };
}

if (typeof global.Headers === 'undefined') {
    global.Headers = class Headers {
        constructor(init) { this.headers = init || {}; }
        set(key, value) { this.headers[key] = value; }
        get(key) { return this.headers[key]; }
    };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
    }
    async json() {
      return JSON.parse(this.body);
    }
    static json(data, init) {
      const body = JSON.stringify(data);
      const headers = new Headers({ 'Content-Type': 'application/json', ...init?.headers });
      return new Response(body, { ...init, headers });
    }
  };
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      }),
    },
  }),
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Play: () => '<svg data-testid="play-icon" />',
  Pause: () => '<svg data-testid="pause-icon" />',
  SkipForward: () => '<svg data-testid="skip-forward-icon" />',
  X: () => '<svg data-testid="x-icon" />',
  Weight: () => '<svg data-testid="weight-icon" />',
  CheckCircle: () => '<svg data-testid="check-circle-icon" />',
  Edit: () => '<svg data-testid="edit-icon" />',
  Trash2: () => '<svg data-testid="trash-icon" />',
  Star: () => '<svg data-testid="star-icon" />',
  Clock: () => '<svg data-testid="clock-icon" />',
  Trophy: () => '<svg data-testid="trophy-icon" />',
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}