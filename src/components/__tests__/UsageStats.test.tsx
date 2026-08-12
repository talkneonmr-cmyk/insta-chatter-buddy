import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/dom';
import UsageStats from '../UsageStats';
import { mockSupabaseClient } from '@/test/mocks/supabase';
import * as useSubscriptionHook from '@/hooks/useSubscription';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/hooks/useSubscription');

describe('UsageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for subscription
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    // Default mock for usage data
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          script_generation: 5,
          caption_generation: 3,
          thumbnail_generation: 2,
          music_generation: 1,
          reset_at: new Date().toISOString(),
        },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
  });

  it('should display free plan badge', async () => {
    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });
  });

  it('should display pro plan badge', async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      isLoading: false,
    });

    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });
  });

  it('should show upgrade button for free users only', async () => {
    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Upgrade to Pro/i })).toBeInTheDocument();
    });
  });

  it('should not show upgrade button for pro users', async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      isLoading: false,
    });

    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Upgrade to Pro/i })).not.toBeInTheDocument();
    });
  });

  it('should display usage counts correctly', async () => {
    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByText('5 / 10')).toBeInTheDocument(); // Script generation
      expect(screen.getByText('3 / 10')).toBeInTheDocument(); // Caption generation
      expect(screen.getByText('2 / 5')).toBeInTheDocument(); // Thumbnail generation
    });
  });

  it('should show unlimited (∞) for pro unlimited features', async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      isLoading: false,
    });

    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getAllByText('∞').length).toBeGreaterThan(0);
    });
  });

  it('should display limit reached message when at limit', async () => {
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          script_generation: 10, // At limit
          caption_generation: 10,
          thumbnail_generation: 5,
          music_generation: 5,
          reset_at: new Date().toISOString(),
        },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getAllByText('Limit reached').length).toBeGreaterThan(0);
    });
  });

  it('should show reset countdown', async () => {
    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByText(/Resets in/i)).toBeInTheDocument();
    });
  });

  it('should create usage tracking if not exists', async () => {
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<UsageStats />);

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('usage_tracking');
    });
  });

  it('should handle loading state', () => {
    render(<UsageStats />);

    expect(screen.getByText(/Loading usage stats/i)).toBeInTheDocument();
  });
});
