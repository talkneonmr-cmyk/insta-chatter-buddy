import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@/test/test-utils';
import { screen } from '@testing-library/dom';
import UsageResetCountdown from '../UsageResetCountdown';

describe('UsageResetCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display countdown with hours and minutes', () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000); // 5h 30m from now
    
    render(<UsageResetCountdown resetAt={futureDate.toISOString()} />);

    expect(screen.getByText(/Resets in/i)).toBeInTheDocument();
    expect(screen.getByText(/5h 30m/)).toBeInTheDocument();
  });

  it('should display clock icon', () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    render(<UsageResetCountdown resetAt={futureDate.toISOString()} />);

    const clockIcon = screen.getByText(/Resets in/i).previousSibling;
    expect(clockIcon).toBeInTheDocument();
  });

  it('should calculate next reset if reset time has passed', () => {
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    render(<UsageResetCountdown resetAt={pastDate.toISOString()} />);

    // Should show time until next reset (22 hours from now approximately)
    expect(screen.getByText(/Resets in/i)).toBeInTheDocument();
    expect(screen.getByText(/\d+h \d+m/)).toBeInTheDocument();
  });

  it('should use default 24h if no resetAt provided', () => {
    render(<UsageResetCountdown />);

    expect(screen.getByText(/Resets in/i)).toBeInTheDocument();
    expect(screen.getByText(/23h \d+m/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const futureDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
    
    const { container } = render(
      <UsageResetCountdown resetAt={futureDate.toISOString()} className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
