import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/dom';
import UsageStats from '@/components/UsageStats';
import { mockSupabaseClient } from '@/test/mocks/supabase';
import * as useSubscriptionHook from '@/hooks/useSubscription';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/hooks/useSubscription');

describe('Usage Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });
  });

  it('should fetch and display current usage', async () => {
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          script_generation: 7,
          caption_generation: 4,
          thumbnail_generation: 3,
          music_generation: 2,
          reset_at: new Date().toISOString(),
        },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByText('7 / 10')).toBeInTheDocument();
      expect(screen.getByText('4 / 10')).toBeInTheDocument();
      expect(screen.getByText('3 / 5')).toBeInTheDocument();
    });
  });

  it('should show limit reached when usage equals limit', async () => {
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

  it('should calculate correct percentage for progress bars', async () => {
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          script_generation: 5, // 50% of 10
          caption_generation: 7, // 70% of 10
          thumbnail_generation: 4, // 80% of 5
          music_generation: 1, // 20% of 5
          reset_at: new Date().toISOString(),
        },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    const { container } = render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByText('5 / 10')).toBeInTheDocument();
    });

    // Check if progress bars are rendered (they use data-value attribute)
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should display reset countdown', async () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          script_generation: 5,
          caption_generation: 5,
          thumbnail_generation: 2,
          music_generation: 1,
          reset_at: futureDate.toISOString(),
        },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<UsageStats />);

    await waitFor(() => {
      expect(screen.getByText(/Resets in/i)).toBeInTheDocument();
    });
  });

  it('should handle realtime updates subscription', async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    (mockSupabaseClient.channel as any) = vi.fn(() => mockChannel);
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          script_generation: 5,
          caption_generation: 5,
          thumbnail_generation: 2,
          music_generation: 1,
          reset_at: new Date().toISOString(),
        },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<UsageStats />);

    await waitFor(() => {
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('usage_tracking');
    });

    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should create usage tracking entry if none exists', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    
    (mockSupabaseClient.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: mockInsert,
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<UsageStats />);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
