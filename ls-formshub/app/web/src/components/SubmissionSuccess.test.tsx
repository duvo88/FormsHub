import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SubmissionSuccess from './SubmissionSuccess';

// Mock apiService
jest.mock('../services/apiService', () => ({
  __esModule: true,
  default: {
    verifyPaymentSession: jest.fn(),
  },
}));

// Wrap with Router and provide URL parameters
const renderWithRouter = (component: React.ReactElement, initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('SubmissionSuccess Component', () => {
  test('renders loading state initially when session_id is provided', () => {
    renderWithRouter(<SubmissionSuccess />, ['/?session_id=test123']);
    
    expect(screen.getByText(/verifying/i)).toBeInTheDocument();
  });

  test('renders error when no session_id and not free', () => {
    renderWithRouter(<SubmissionSuccess />, ['/']);
    
    expect(screen.getByText(/payment verification failed/i)).toBeInTheDocument();
    expect(screen.getByText(/no payment session found/i)).toBeInTheDocument();
  });

  test('renders success state for free submissions', () => {
    renderWithRouter(<SubmissionSuccess />, ['/?free=true']);
    
    // Should show success state for free submissions
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });

  test('component renders without crashing', () => {
    const { container } = renderWithRouter(<SubmissionSuccess />, ['/?free=true']);
    
    expect(container).toBeInTheDocument();
  });
});
