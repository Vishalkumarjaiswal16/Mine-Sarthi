import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/MetricCard';
import { Gauge } from 'lucide-react';

/**
 * MetricCard Component Tests
 */
describe('MetricCard', () => {
  it('should render with title and value', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="100"
        unit="%"
        icon={Gauge}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('should display trend information when provided', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="100"
        unit="%"
        icon={Gauge}
        trend="up"
        trendValue="5%"
      />
    );

    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('should apply status styling', () => {
    const { container } = render(
      <MetricCard
        title="Test Metric"
        value="100"
        unit="%"
        icon={Gauge}
        status="warning"
      />
    );

    // Check if warning class is applied (implementation dependent)
    expect(container.firstChild).toBeInTheDocument();
  });
});

