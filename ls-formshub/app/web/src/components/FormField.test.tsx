import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormField from './FormField';

describe('FormField Component', () => {
  test('renders label and input', () => {
    render(<FormField label="Email" name="email" />);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('renders required asterisk for fields with asterisk in label', () => {
    render(<FormField label="Email *" name="email" />);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveStyle({ color: '#F26522' });
  });

  test('does not render asterisk for non-required fields', () => {
    render(<FormField label="Email" name="email" />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  test('displays error message when error prop is provided', () => {
    render(<FormField label="Email" name="email" error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('form-input error');
  });

  test('does not display error message when error prop is not provided', () => {
    render(<FormField label="Email" name="email" />);
    
    expect(screen.queryByText(/This field is required/i)).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveClass('error');
  });

  test('passes through HTML input attributes', () => {
    render(
      <FormField 
        label="Email" 
        name="email" 
        type="email"
        placeholder="Enter your email"
        required
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter your email');
    expect(input).toBeRequired();
  });

  test('calls onBlur handler when input loses focus', async () => {
    const handleBlur = jest.fn();
    
    render(<FormField label="Email" name="email" onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Move focus away
    
    expect(handleBlur).toHaveBeenCalled();
  });

  test('applies correct name attribute', () => {
    render(<FormField label="Email" name="userEmail" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'userEmail');
  });

  test('renders with disabled state', () => {
    render(<FormField label="Email" name="email" disabled />);
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('handles value changes', async () => {
    render(<FormField label="Email" name="email" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.type(input, 'test@example.com');
    
    expect(input.value).toBe('test@example.com');
  });
});
