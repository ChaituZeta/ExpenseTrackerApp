import { vi } from "vitest";

export function getMockSupabaseInstance() {
  const mockChain: any = {
    select: vi.fn().mockImplementation(() => mockChain),
    eq: vi.fn().mockImplementation(() => mockChain),
    order: vi.fn().mockImplementation(() => mockChain),
    limit: vi.fn().mockImplementation(() => mockChain),
    insert: vi.fn().mockImplementation(() => mockChain),
    update: vi.fn().mockImplementation(() => mockChain),
    delete: vi.fn().mockImplementation(() => mockChain),
    upsert: vi.fn().mockImplementation(() => mockChain),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  // Mock then mapping dynamically for queries that are awaited immediately
  mockChain.then = (onfulfilled: any) => {
    return Promise.resolve({ data: [], error: null }).then(onfulfilled);
  };

  const mockClient = {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" }, session: { access_token: "test" } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id", email: "test@example.com" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null }),
    },
    from: vi.fn().mockReturnValue(mockChain),
  };

  return { mockClient, mockChain };
}
