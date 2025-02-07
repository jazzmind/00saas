import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '../Navigation';
import { Organization } from '../../lib/types';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ organizations: [] }),
  } as Response)
) as jest.MockedFunction<typeof fetch>;

describe('Navigation Component', () => {
  const mockUser = {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockOrganizations: Organization[] = [
    {
      id: 'org1',
      name: 'Organization 1',
      plan: 'free' as const,
      slug: 'org-1',
      settings: {
        allowedAuthMethods: ['passkey'],
        requireMFA: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [{
        userId: 'user123',
        role: 'owner' as const,
        organizationId: 'org1',
        joinedAt: new Date()
      }],
    },
    {
      id: 'org2',
      name: 'Organization 2',
      plan: 'pro' as const,
      slug: 'org-2',
      settings: {
        allowedAuthMethods: ['saml'],
        requireMFA: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [{
        userId: 'user123',
        role: 'owner' as const,
        organizationId: 'org1',
        joinedAt: new Date()
      }],
    },
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ organizations: mockOrganizations }),
      })
    );
  });

  it('renders without user', () => {
    render(<Navigation />);
    
    expect(screen.getByText('00SaaS')).toBeInTheDocument();
    expect(screen.queryByText('Select Organization')).not.toBeInTheDocument();
  });

  it('renders with user and organizations', async () => {
    render(<Navigation currentUser={mockUser} />);
    
    // Logo should be visible
    expect(screen.getByText('00SaaS')).toBeInTheDocument();
    
    // Organization switcher should be visible with first org selected
    const orgButton = await screen.findByText('Organization 1');
    expect(orgButton).toBeInTheDocument();
    
    // User menu should show first letter of name
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('opens organization dropdown on click', async () => {
    render(<Navigation currentUser={mockUser} />);
    
    // Click the organization switcher
    const orgButton = await screen.findByText('Organization 1');
    fireEvent.click(orgButton);
    
    // Both organizations should be visible
    expect(screen.getByText('Organization 1')).toBeInTheDocument();
    expect(screen.getByText('Organization 2')).toBeInTheDocument();
  });

  it('opens account dropdown and shows correct options', async () => {
    render(<Navigation currentUser={mockUser} />);
    
    // Click the account button
    const accountButton = screen.getByText('J');
    fireEvent.click(accountButton);
    
    // Check dropdown content
    expect(screen.getByText('Signed in as')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Organization Admin')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('switches active organization', async () => {
    render(<Navigation currentUser={mockUser} />);
    
    // Open organization dropdown
    const orgButton = await screen.findByText('Organization 1');
    fireEvent.click(orgButton);
    
    // Click second organization
    fireEvent.click(screen.getByText('Organization 2'));
    
    // Second organization should now be active
    expect(screen.getByText('Organization 2')).toBeInTheDocument();
    expect(screen.queryByText('Organization 1')).not.toBeInTheDocument();
  });
});

/**
 * @note For AI Agents:
 * When extending these tests:
 * 1. Test all interactive elements
 * 2. Verify proper state management
 * 3. Test loading states and error cases
 * 4. Test responsive behavior
 * 5. Mock external dependencies
 */ 