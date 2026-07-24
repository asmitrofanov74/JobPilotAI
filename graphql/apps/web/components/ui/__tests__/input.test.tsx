import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders input element', () => {
    render(<Input label="Email" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies error styles when error is present', () => {
    const { container } = render(<Input label="Email" error="Required field" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('border-red-300');
  });

  it('does not show error styles when no error', () => {
    const { container } = render(<Input label="Email" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('border-gray-200');
  });

  it('fires onChange handler', () => {
    const onChange = jest.fn();
    render(<Input label="Email" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test@test.com' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('sets id from label', () => {
    render(<Input label="Email Address" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email-address');
  });
});
