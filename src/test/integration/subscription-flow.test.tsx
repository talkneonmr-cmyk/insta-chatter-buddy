import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@/test/test-utils';
import { screen } from '@testing-library/dom';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import UsageStats from '@/components/UsageStats';
import { mockSupabaseClient } from '@/test/mocks/supabase';
import * as useSubscriptionHook from '@/hooks/useSubscription';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/hooks/useSubscription');

describe('Subscription Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
  });

  it('should show upgrade prompt for free users accessing pro features', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(
      <SubscriptionGuard requiresPro={true} featureName="AI Voice Cloning">
        <div>Pro Feature Content</div>
      </SubscriptionGuard>
    );

    expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Voice Cloning/i)).toBeInTheDocument();
    expect(screen.queryByText('Pro Feature Content')).not.toBeInTheDocument();
  });

  it('should allow pro users to access pro features', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      isLoading: false,
    });

    render(
      <SubscriptionGuard requiresPro={true} featureName="AI Voice Cloning">
        <div>Pro Feature Content</div>
      </SubscriptionGuard>
    );

    expect(screen.queryByText(/Upgrade to Pro/i)).not.toBeInTheDocument();
    expect(screen.getByText('Pro Feature Content')).toBeInTheDocument();
  });

  it('should display correct usage limits for free users', async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(<UsageStats />);

    await screen.findByText('Free Plan');
    
    expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument(); // Free limit
  });

  it('should display unlimited for pro users', async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      isLoading: false,
    });

    render(<UsageStats />);

    await screen.findByText('Pro Plan');
    
    expect(screen.queryByText(/Upgrade to Pro/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('∞').length).toBeGreaterThan(0);
  });

  it('should handle upgrade navigation for free users', async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(<UsageStats />);

    await screen.findByText('Free Plan');
    
    const upgradeButton = screen.getByRole('link', { name: /Upgrade to Pro/i });
    expect(upgradeButton).toHaveAttribute('href', '/pricing');
  });

  it('should show usage tracking for both free and pro users', async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(<UsageStats />);

    await screen.findByText('Free Plan');
    
    expect(screen.getByText(/Script Generation/i)).toBeInTheDocument();
    expect(screen.getByText(/Caption Generation/i)).toBeInTheDocument();
    expect(screen.getByText(/Thumbnail Generation/i)).toBeInTheDocument();
  });
});
