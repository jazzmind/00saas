import { getInternalApiHeaders } from '@/middleware';

export async function internalFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = {
    ...init?.headers,
    ...getInternalApiHeaders()
  };

  return fetch(input, {
    ...init,
    headers
  });
} 