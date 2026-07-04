import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies gray variant by default', () => {
    const { container } = render(<Badge>Gray</Badge>);
    const span = container.firstChild;
    expect(span?.className).toContain('bg-gray-100');
    expect(span?.className).toContain('text-gray-700');
  });

  it('applies blue variant', () => {
    const { container } = render(<Badge variant="blue">Blue</Badge>);
    const span = container.firstChild;
    expect(span?.className).toContain('bg-blue-100');
    expect(span?.className).toContain('text-blue-700');
  });

  it('applies green variant', () => {
    const { container } = render(<Badge variant="green">Green</Badge>);
    const span = container.firstChild;
    expect(span?.className).toContain('bg-green-100');
    expect(span?.className).toContain('text-green-700');
  });

  it('renders dot when dot prop is true', () => {
    const { container } = render(<Badge dot>With Dot</Badge>);
    const dot = container.querySelector('span > span');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('rounded-full');
  });

  it('does not render dot by default', () => {
    const { container } = render(<Badge>No Dot</Badge>);
    const dot = container.querySelector('span > span');
    expect(dot).not.toBeInTheDocument();
  });
});
