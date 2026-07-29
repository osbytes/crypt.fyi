import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { ErrorInvalidKeyAndOrPassword } from '@crypt.fyi/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ViewPage } from './View';

const useMutationMock = vi.hoisted(() =>
  vi.fn((_options: Record<string, unknown>) => ({
    data: undefined,
    error: null as Error | null,
    isPending: false,
    mutate: vi.fn(),
    reset: vi.fn(),
  })),
);

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useParams: () => ({ id: 'vault-id' }),
  useSearch: () => ({}),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: useMutationMock,
  useQuery: () => ({
    data: undefined,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/context/client', () => ({
  useClient: () => ({
    client: {
      exists: vi.fn(),
      read: vi.fn(),
    },
  }),
}));

vi.mock('@crypt.fyi/core', () => ({
  ErrorInvalidKeyAndOrPassword: class ErrorInvalidKeyAndOrPassword extends Error {},
  ErrorNotFound: class ErrorNotFound extends Error {},
  sleep: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  useMutationMock.mockClear();
});

describe('ViewPage decryption key entry', () => {
  it('renders an accessible key form when the URL has no key', () => {
    vi.stubGlobal('window', {
      location: {
        hash: '',
        pathname: '/vault-id',
        search: '',
      },
    });

    const html = renderToStaticMarkup(<ViewPage />);

    expect(html).toContain('for="decryption-key"');
    expect(html).toContain('id="decryption-key"');
    expect(html).toContain('type="password"');
    expect(html).toContain('autoComplete="off"');
    expect(html).toContain('aria-describedby="decryption-key-description"');
    expect(html).toContain('view.key.description');
  });

  it('keeps a fragment key out of the React Query mutation key', () => {
    const rawKey = 'fragment-key-must-not-enter-cache-identity';
    vi.stubGlobal('window', {
      location: {
        hash: `#${rawKey}`,
        pathname: '/vault-id',
        search: '',
      },
    });

    const html = renderToStaticMarkup(<ViewPage />);
    const mutationOptions = useMutationMock.mock.calls.at(-1)?.[0];

    expect(html).toContain('view.actions.viewSecret');
    expect(mutationOptions).toEqual(
      expect.objectContaining({
        mutationKey: ['vault-id', 'decrypt'],
        gcTime: 0,
      }),
    );
    expect(JSON.stringify(mutationOptions)).not.toContain(rawKey);
  });

  it('offers manual recovery after a fragment key fails', () => {
    useMutationMock.mockImplementationOnce(() => ({
      data: undefined,
      error: new ErrorInvalidKeyAndOrPassword(),
      isPending: false,
      mutate: vi.fn(),
      reset: vi.fn(),
    }));
    vi.stubGlobal('window', {
      location: {
        hash: '#wrong-fragment-key',
        pathname: '/vault-id',
        search: '',
      },
    });

    const html = renderToStaticMarkup(<ViewPage />);

    expect(html).toContain('view.invalidLink.title');
    expect(html).toContain('view.key.change');
  });
});
