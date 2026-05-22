/**
 * Shared type aliases for integration route tests.
 * Import only the types each test file actually uses.
 */

export type Session = {
  user: {
    id: string;
  };
};

export type HeadersProvider = () => Promise<Headers>;

export type GetSession = (args: {
  headers: Headers;
}) => Promise<Session | null>;

export type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;

export type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;
