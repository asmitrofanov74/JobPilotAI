import { render, screen } from '@testing-library/react';
import { Card } from '../card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default padding', () => {
    const { container } = render(<Card>Content</Card>);
    const div = container.firstChild as Element;
    expect(div?.className).toContain('p-5');
  });

  it('applies sm padding', () => {
    const { container } = render(<Card padding="sm">Content</Card>);
    const div = container.firstChild as Element;
    expect(div?.className).toContain('p-4');
  });

  it('applies lg padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const div = container.firstChild as Element;
    expect(div?.className).toContain('p-6');
  });

  it('adds hover styles when hover prop is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    const div = container.firstChild as Element;
    expect(div?.className).toContain('hover:shadow-md');
  });

  it('does not add hover styles by default', () => {
    const { container } = render(<Card>Content</Card>);
    const div = container.firstChild as Element;
    expect(div?.className).not.toContain('hover:shadow-md');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const div = container.firstChild as Element;
    expect(div?.className).toContain('custom-class');
  });
});
