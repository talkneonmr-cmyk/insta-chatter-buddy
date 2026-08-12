import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@/test/test-utils';
import { waitFor } from '@testing-library/dom';
import { useSubscription } from '../useSubscription';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default free plan and loading state', () => {
    const { result } = renderHook(() => useSubscription());

    expect(result.current.plan).toBe('free');
    expect(result.current.status).toBe('active');
    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch and set pro subscription data', async () => {
    const mockProData = {
      plan: 'pro',
      status: 'active',
      subscription_id: 'sub_123',
    };

    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: mockProData,
        error: null,
      }),
    }));

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('pro');
    expect(result.current.status).toBe('active');
  });

  it('should create default subscription if none exists', async () => {
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      single: vi.fn().mockResolvedValue({
        data: { plan: 'free', status: 'active' },
        error: null,
      }),
    }));

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('free');
  });

  it('should handle fetch errors gracefully', async () => {
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }));

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('free');
  });

  it('should handle null user gracefully', async () => {
    mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('free');
  });

  it('should set up realtime subscription', async () => {
    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('user_subscriptions');
    });
  });

  it('should cleanup channel on unmount', async () => {
    const mockUnsubscribe = vi.fn();
    (mockSupabaseClient.channel as any) = vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: mockUnsubscribe,
    }));

    const { unmount } = renderHook(() => useSubscription());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
