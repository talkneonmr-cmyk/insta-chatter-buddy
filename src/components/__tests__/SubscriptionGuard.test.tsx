import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@/test/test-utils';
import { screen } from '@testing-library/dom';
import SubscriptionGuard from '../SubscriptionGuard';
import * as useSubscriptionHook from '@/hooks/useSubscription';

vi.mock('@/hooks/useSubscription');

describe('SubscriptionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when not requiring pro plan', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(
      <SubscriptionGuard requiresPro={false}>
        <div>Test Content</div>
      </SubscriptionGuard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render children for pro users', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      isLoading: false,
    });

    render(
      <SubscriptionGuard requiresPro={true}>
        <div>Pro Feature</div>
      </SubscriptionGuard>
    );

    expect(screen.getByText('Pro Feature')).toBeInTheDocument();
  });

  it('should show upgrade prompt for free users when requiring pro', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(
      <SubscriptionGuard requiresPro={true} featureName="Advanced Analytics">
        <div>Pro Feature</div>
      </SubscriptionGuard>
    );

    expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Advanced Analytics/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: true,
    });

    render(
      <SubscriptionGuard requiresPro={true}>
        <div>Test Content</div>
      </SubscriptionGuard>
    );

    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('should show upgrade to pro button in upgrade prompt', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(
      <SubscriptionGuard requiresPro={true}>
        <div>Pro Feature</div>
      </SubscriptionGuard>
    );

    expect(screen.getByRole('link', { name: /Upgrade to Pro/i })).toBeInTheDocument();
  });

  it('should not render children when free user and requires pro', () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      plan: 'free',
      status: 'active',
      isLoading: false,
    });

    render(
      <SubscriptionGuard requiresPro={true}>
        <div>Secret Pro Content</div>
      </SubscriptionGuard>
    );

    expect(screen.queryByText('Secret Pro Content')).not.toBeInTheDocument();
  });
});
