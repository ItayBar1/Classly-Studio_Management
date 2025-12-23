type QueryResponse<T = any> = {
  data: T | null;
  error: any;
};

let responseQueue: Array<QueryResponse> = [];
let queries: any[] = [];

const createQuery = (response: QueryResponse) => {
  const query: any = {
    select: jest.fn(() => query),
    insert: jest.fn(() => query),
    update: jest.fn(() => query),
    delete: jest.fn(() => query),
    eq: jest.fn(() => query),
    ilike: jest.fn(() => query),
    in: jest.fn(() => query),
    order: jest.fn(() => query),
    range: jest.fn(() => query),
    gt: jest.fn(() => query),
    single: jest.fn(() => query),
    rpc: jest.fn(() => query),
    then: (resolve: any, reject: any) => Promise.resolve(response).then(resolve, reject),
  };
  queries.push(query);
  return query;
};

export const supabaseAdmin = {
  from: jest.fn((table: string) => {
    const query = createQuery(responseQueue.shift() ?? { data: null, error: null });
    (query as any).table = table;
    return query;
  }),
  rpc: jest.fn((_fn: string, _params?: Record<string, unknown>) =>
    createQuery(responseQueue.shift() ?? { data: null, error: null })
  ),
  auth: {
    getUser: jest.fn(),
    admin: {
      createUser: jest.fn(),
      updateUserById: jest.fn(),
    },
  },
};

export const queueQueryResponse = (response: QueryResponse) => {
  responseQueue.push(response);
};

export const getLastQuery = () => queries[queries.length - 1];

export const resetSupabaseMock = () => {
  responseQueue = [];
  queries = [];
  supabaseAdmin.from.mockClear();
  supabaseAdmin.rpc.mockClear();
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'mock-user' } }, error: null });
  supabaseAdmin.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'mock-user' } }, error: null });
  supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ data: { user: { id: 'mock-user' } }, error: null });
};

resetSupabaseMock();
