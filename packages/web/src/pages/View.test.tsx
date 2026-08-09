// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorInvalidKeyAndOrPassword, ErrorUnexpectedStatus } from '@crypt.fyi/core';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewPage } from './View';

const mockClient = vi.hoisted(() => ({
  exists: vi.fn(),
  read: vi.fn(),
}));
const mockSearch = vi.hoisted(() => ({ p: undefined as boolean | undefined }));

vi.mock('@/config', () => ({
  config: { IS_DEV: false },
}));

vi.mock('@/context/client', () => ({
  useClient: () => ({ client: mockClient }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useParams: () => ({ id: 'vault-id' }),
  useSearch: () => mockSearch,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <ViewPage />
    </QueryClientProvider>,
  );

  return { ...view, queryClient };
}

describe('ViewPage recovery', () => {
  beforeEach(() => {
    mockClient.exists.mockReset();
    mockClient.read.mockReset();
    mockClient.exists.mockResolvedValue(true);
    mockSearch.p = undefined;
    window.history.replaceState({}, '', '/vault-id');
  });

  afterEach(() => {
    cleanup();
  });

  it('returns to the key form after a manually entered key is rejected', async () => {
    mockClient.read.mockRejectedValueOnce(new ErrorInvalidKeyAndOrPassword());
    renderView();

    const keyInput = await screen.findByLabelText('view.key.label');
    fireEvent.change(keyInput, { target: { value: 'wrong-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'view.key.submit' }));

    await waitFor(() => {
      expect(mockClient.read).toHaveBeenCalledWith('vault-id', 'wrong-key', '');
    });

    const error = await screen.findByRole('alert');
    expect(error.textContent).toBe('view.key.error');
    expect(screen.getByLabelText('view.key.label')).toBeTruthy();
    expect(screen.queryByText('view.invalidLink.title')).toBeNull();
  });

  it('keeps the invalid-link recovery for a rejected fragment key', async () => {
    window.history.replaceState({}, '', '/vault-id#wrong-key');
    mockClient.read.mockRejectedValueOnce(new ErrorInvalidKeyAndOrPassword());
    renderView();

    fireEvent.click(await screen.findByRole('button', { name: 'view.actions.viewSecret' }));

    expect(await screen.findByText('view.invalidLink.title')).toBeTruthy();
    expect(screen.queryByLabelText('view.key.label')).toBeNull();
  });

  it('keeps a wrong password on the credential form', async () => {
    window.history.replaceState({}, '', '/vault-id#valid-key');
    mockSearch.p = true;
    mockClient.read.mockRejectedValueOnce(new ErrorInvalidKeyAndOrPassword());
    renderView();

    const passwordInput = await screen.findByLabelText('view.password.label');
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'view.key.submit' }));

    await waitFor(() => {
      expect(mockClient.read).toHaveBeenCalledWith('vault-id', 'valid-key', 'wrong-password');
    });

    const error = await screen.findByRole('alert');
    expect(error.textContent).toBe('view.password.error');
    expect(screen.getByLabelText('view.password.label')).toBeTruthy();
    expect(screen.queryByText('view.invalidLink.title')).toBeNull();
  });

  it('retries a rate-limited existence check before showing credentials', async () => {
    mockClient.exists
      .mockRejectedValueOnce(new ErrorUnexpectedStatus(429))
      .mockResolvedValueOnce(true);
    renderView();

    expect(await screen.findByText('view.rateLimit.title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'view.rateLimit.tryAgain' }));

    await waitFor(() => {
      expect(mockClient.exists).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByLabelText('view.key.label')).toBeTruthy();
  });

  it('retries a failed existence check before showing credentials', async () => {
    mockClient.exists
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce(true);
    renderView();

    expect(await screen.findByText('view.connectionError.title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'view.connectionError.tryAgain' }));

    await waitFor(() => {
      expect(mockClient.exists).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByLabelText('view.key.label')).toBeTruthy();
  });

  it('retries a rate-limited read without leaving a blank view', async () => {
    window.history.replaceState({}, '', '/vault-id#valid-key');
    mockClient.read.mockRejectedValueOnce(new ErrorUnexpectedStatus(429)).mockResolvedValueOnce({
      c: 'decrypted secret',
      burned: false,
      cd: Date.now(),
      ttl: 60_000,
    });
    renderView();

    fireEvent.click(await screen.findByRole('button', { name: 'view.actions.viewSecret' }));
    expect(await screen.findByText('view.rateLimit.title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'view.rateLimit.tryAgain' }));

    await waitFor(() => {
      expect(mockClient.read).toHaveBeenCalledTimes(2);
    });
    expect((await screen.findByLabelText('view.content.ariaLabel')).textContent).toBe(
      'decrypted secret',
    );
  });

  it('retries an unexpected read failure without leaving a blank view', async () => {
    window.history.replaceState({}, '', '/vault-id#valid-key');
    mockClient.read.mockRejectedValueOnce(new Error('network failed')).mockResolvedValueOnce({
      c: 'decrypted secret',
      burned: false,
      cd: Date.now(),
      ttl: 60_000,
    });
    renderView();

    fireEvent.click(await screen.findByRole('button', { name: 'view.actions.viewSecret' }));
    expect(await screen.findByText('view.connectionError.title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'view.connectionError.tryAgain' }));

    await waitFor(() => {
      expect(mockClient.read).toHaveBeenCalledTimes(2);
    });
    expect((await screen.findByLabelText('view.content.ariaLabel')).textContent).toBe(
      'decrypted secret',
    );
  });

  it('keeps decrypted content through background stale-query refreshes', async () => {
    window.history.replaceState({}, '', '/vault-id#valid-key');
    mockClient.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    mockClient.read.mockResolvedValueOnce({
      c: 'burned secret',
      burned: true,
      cd: Date.now(),
      ttl: 60_000,
    });
    const { queryClient } = renderView();

    fireEvent.click(await screen.findByRole('button', { name: 'view.actions.viewSecret' }));
    expect((await screen.findByLabelText('view.content.ariaLabel')).textContent).toBe(
      'burned secret',
    );

    await queryClient.refetchQueries({
      queryKey: ['vault-id', 'exists'],
      stale: true,
      type: 'active',
    });

    expect(mockClient.exists).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('view.content.ariaLabel').textContent).toBe('burned secret');
    expect(screen.queryByText('view.notFound.title')).toBeNull();
  });
});
