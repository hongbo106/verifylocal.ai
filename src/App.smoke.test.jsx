import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const USERS_KEY = 'vl_users';
const PROOFS_KEY = 'vl_proofs';
const BOUNTIES_KEY = 'vl_bounties';

function seedState({ users, proofs = [], bounties = [] }) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(PROOFS_KEY, JSON.stringify(proofs));
  localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));
}

function signInAs({ role, email, password }) {
  if (role) {
    fireEvent.click(screen.getByRole('button', { name: role }));
  }
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Access Node' }));
}

describe('App smoke tests', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('shows admin empty evidence state after login', () => {
    seedState({
      users: [{ email: 'admin@verifylocal.ai', password: 'admin', role: 'admin', name: 'Tony Wang, PhD' }],
      proofs: [],
    });

    window.history.pushState({}, '', '/admin');

    render(<App />);

    signInAs({ email: 'admin@verifylocal.ai', password: 'admin' });

    expect(screen.getByText('Global Audit Center')).toBeInTheDocument();
    expect(screen.getByText('No evidence submitted yet.')).toBeInTheDocument();
  });

  it('shows merchant empty proof state after login', () => {
    seedState({
      users: [
        {
          id: 2,
          role: 'merchant',
          email: 'merchant@example.com',
          password: 'test123',
          name: 'Mia Merchant',
          businessName: 'Stonebridge Restaurant',
        },
      ],
      proofs: [],
    });

    render(<App />);

    signInAs({ role: 'merchant', email: 'merchant@example.com', password: 'test123' });

    expect(screen.getByText('Deploy Budget')).toBeInTheDocument();
    expect(screen.getByText('No proofs yet. Deploy a bounty to start receiving evidence.')).toBeInTheDocument();
  });

  it('shows influencer empty bounty and submission states after login', () => {
    seedState({
      users: [
        {
          id: 3,
          role: 'influencer',
          email: 'influencer@example.com',
          password: 'test123',
          name: 'Ivy Influencer',
          socialHandle: '@ivy',
        },
      ],
      bounties: [],
      proofs: [],
    });

    render(<App />);

    signInAs({ role: 'influencer', email: 'influencer@example.com', password: 'test123' });

    expect(screen.getByText('Bounties Near You')).toBeInTheDocument();
    expect(screen.getByText('No active bounties in your area yet.')).toBeInTheDocument();
    expect(screen.getByText('You have no verified submissions yet.')).toBeInTheDocument();
  });
});
