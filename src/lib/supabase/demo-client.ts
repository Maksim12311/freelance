/**
 * Chainable no-op Supabase-like client for local UI without a database.
 * All queries resolve to empty / null results so pages don't crash.
 */

type ThenableResult = {
  data: unknown;
  error: null;
  count: number | null;
};

function result(data: unknown = null, count: number | null = null): ThenableResult {
  return { data, error: null, count };
}

class DemoQueryBuilder implements PromiseLike<ThenableResult> {
  private _single = false;
  private _maybe = false;
  private _countHead = false;

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    if (options?.head) this._countHead = true;
    return this;
  }
  insert(_values?: unknown) {
    return this;
  }
  upsert(_values?: unknown, _opts?: unknown) {
    return this;
  }
  update(_values?: unknown) {
    return this;
  }
  delete() {
    return this;
  }
  eq(_c?: string, _v?: unknown) {
    return this;
  }
  neq(_c?: string, _v?: unknown) {
    return this;
  }
  in(_c?: string, _v?: unknown) {
    return this;
  }
  or(_f?: string) {
    return this;
  }
  ilike(_c?: string, _v?: unknown) {
    return this;
  }
  gte(_c?: string, _v?: unknown) {
    return this;
  }
  lte(_c?: string, _v?: unknown) {
    return this;
  }
  gt(_c?: string, _v?: unknown) {
    return this;
  }
  lt(_c?: string, _v?: unknown) {
    return this;
  }
  order(_c?: string, _o?: unknown) {
    return this;
  }
  limit(_n?: number) {
    return this;
  }
  range(_from?: number, _to?: number) {
    return this;
  }
  single() {
    this._single = true;
    return this;
  }
  maybeSingle() {
    this._maybe = true;
    return this;
  }

  then<TResult1 = ThenableResult, TResult2 = never>(
    onfulfilled?: ((value: ThenableResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    const data = this._countHead ? null : this._single || this._maybe ? null : [];
    const count = this._countHead ? 0 : null;
    return Promise.resolve(result(data, count)).then(onfulfilled, onrejected);
  }
}

export function createDemoClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async signUp() {
        return { data: { user: null, session: null }, error: null };
      },
      async signInWithPassword() {
        return { data: { user: null, session: null }, error: null };
      },
      async signOut() {
        return { error: null };
      },
      async resetPasswordForEmail() {
        return { data: {}, error: null };
      },
      async updateUser() {
        return { data: { user: null }, error: null };
      },
      async exchangeCodeForSession() {
        return { data: { session: null }, error: null };
      },
    },
    from(_table: string) {
      return new DemoQueryBuilder();
    },
    rpc(_fn: string, _args?: unknown) {
      return Promise.resolve(result(null));
    },
  };
}

export type DemoClient = ReturnType<typeof createDemoClient>;
