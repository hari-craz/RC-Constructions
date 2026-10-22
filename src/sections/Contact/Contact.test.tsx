import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollProvider } from '../../app/ScrollProvider';
import { Contact } from './Contact';

const renderContact = () =>
  render(
    <ScrollProvider>
      <Contact />
    </ScrollProvider>,
  );

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Contact form configuration', () => {
  it('says sending is switched off, and disables the button, only when the form ID is missing', () => {
    vi.stubEnv('VITE_FORMSPREE_ID', '');
    renderContact();
    expect(screen.getByText('Sending is switched off until the form ID is set.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeDisabled();
  });

  it('shows no such sentence, and an enabled button, when the form ID is set', () => {
    vi.stubEnv('VITE_FORMSPREE_ID', 'abcd1234');
    renderContact();
    expect(screen.queryByText(/switched off/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeEnabled();
  });

  it('marks the contact details as samples while they are samples', () => {
    vi.stubEnv('VITE_FORMSPREE_ID', 'abcd1234');
    renderContact();
    expect(screen.getByText('Sample contact details for this demo.')).toBeVisible();
  });
});
