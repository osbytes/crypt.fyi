import { describe, expect, it } from 'vitest';
import { Route } from './$id';

describe('secret view route lifecycle', () => {
  it('remounts for a different secret or password-protection mode', () => {
    const remountDeps = Route.options.remountDeps as (input: {
      params: { id: string };
      search: { p?: boolean };
    }) => unknown;

    expect(remountDeps({ params: { id: 'first' }, search: {} })).toEqual({
      id: 'first',
      passwordProtected: false,
    });
    expect(remountDeps({ params: { id: 'second' }, search: { p: true } })).toEqual({
      id: 'second',
      passwordProtected: true,
    });
  });
});
