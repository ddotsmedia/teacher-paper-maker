import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  HttpError,
  flattenZodError,
  jsonError,
  jsonOk,
  parseJson,
  route,
} from '../../apps/web/src/lib/http';

function makeRequest(body: unknown, valid = true): Request {
  return {
    json: async () => {
      if (!valid) throw new Error('bad json');
      return body;
    },
  } as unknown as Request;
}

describe('http helpers', () => {
  it('jsonOk returns the data with the given status', async () => {
    const res = jsonOk({ hello: 'world' }, 201);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ hello: 'world' });
  });

  it('jsonError returns an error payload with status', async () => {
    const res = jsonError('nope', 403, { code: 'X' });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'nope', code: 'X' });
  });

  it('flattenZodError keeps the first message per path', () => {
    const result = z.object({ a: z.string(), b: z.number() }).safeParse({ a: 1, b: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(flattenZodError(result.error)).toMatchObject({
        a: expect.any(String),
        b: expect.any(String),
      });
    }
  });

  it('parseJson returns validated data', async () => {
    const schema = z.object({ name: z.string() });
    await expect(parseJson(makeRequest({ name: 'Ada' }), schema)).resolves.toEqual({ name: 'Ada' });
  });

  it('parseJson throws HttpError on invalid JSON', async () => {
    const schema = z.object({ name: z.string() });
    await expect(parseJson(makeRequest(null, false), schema)).rejects.toBeInstanceOf(HttpError);
  });

  it('parseJson throws HttpError with issues on schema failure', async () => {
    const schema = z.object({ name: z.string() });
    await expect(parseJson(makeRequest({ name: 123 }), schema)).rejects.toMatchObject({
      status: 400,
      extra: { issues: { name: expect.any(String) } },
    });
  });

  it('route passes through a successful response', async () => {
    const handler = route(async () => jsonOk({ ok: true }));
    const res = await handler();
    expect(res.status).toBe(200);
  });

  it('route converts HttpError into a JSON error response', async () => {
    const handler = route(async () => {
      throw new HttpError('Unauthorized', 401);
    });
    const res = await handler();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('route converts unexpected errors into a 500 without leaking details', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = route(async () => {
      throw new Error('secret internal detail');
    });
    const res = await handler();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Internal server error' });
    spy.mockRestore();
  });
});
