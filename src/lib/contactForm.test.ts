import { describe, expect, it } from 'vitest';
import {
  isHoneypotTriggered,
  isRateLimited,
  validateContactField,
  validateContactForm,
  type ContactFormData,
} from './contactForm';

describe('contactForm validation helpers', () => {
  it('validates name: required and min 2 characters', () => {
    expect(validateContactField('name', '')).toBe('Please enter your name.');
    expect(validateContactField('name', '   ')).toBe('Please enter your name.');
    expect(validateContactField('name', 'A')).toBe('Name must be at least 2 characters.');
    expect(validateContactField('name', 'Gokul')).toBeUndefined();
  });

  it('validates phone: required and minimum 7 digits with valid characters', () => {
    expect(validateContactField('phone', '')).toBe('Please enter your telephone number.');
    expect(validateContactField('phone', 'abc1234')).toBe('Please enter a valid telephone number.');
    expect(validateContactField('phone', '12345')).toBe('Please enter a valid telephone number.');
    expect(validateContactField('phone', '+91 44 2847 0000')).toBeUndefined();
    expect(validateContactField('phone', '9840012345')).toBeUndefined();
  });

  it('validates email: optional but must be valid if entered', () => {
    expect(validateContactField('email', '')).toBeUndefined();
    expect(validateContactField('email', 'not-an-email')).toBe(
      'Please enter a valid email address.',
    );
    expect(validateContactField('email', 'build@rcconstructions.com')).toBeUndefined();
  });

  it('validates message: required between 10 and 2000 characters', () => {
    expect(validateContactField('message', '')).toBe('Please describe your project.');
    expect(validateContactField('message', 'Short')).toBe(
      'Project description must be at least 10 characters.',
    );
    expect(
      validateContactField('message', 'Valid commercial building tender scope'),
    ).toBeUndefined();
    expect(validateContactField('message', 'x'.repeat(2001))).toBe(
      'Project description must not exceed 2000 characters.',
    );
  });

  it('validates entire form object returning error keys', () => {
    const invalidData: ContactFormData = {
      name: '',
      phone: '',
      email: 'invalid',
      projectType: 'Commercial',
      location: 'Chennai',
      message: 'Too short',
      _gotcha: '',
    };

    const errors = validateContactForm(invalidData);
    expect(errors.name).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.message).toBeTruthy();

    const validData: ContactFormData = {
      name: 'Client Tenderer',
      phone: '+91 44 2847 0000',
      email: 'tender@domain.com',
      projectType: 'Commercial',
      location: 'Chennai',
      message: 'Construct a four-storey commercial reinforced frame.',
      _gotcha: '',
    };

    const validErrors = validateContactForm(validData);
    expect(Object.keys(validErrors)).toHaveLength(0);
  });

  it('enforces rate guard cooldown of 3000ms', () => {
    const now = 10000;
    expect(isRateLimited(0, now)).toBe(false);
    expect(isRateLimited(now - 1000, now)).toBe(true);
    expect(isRateLimited(now - 2999, now)).toBe(true);
    expect(isRateLimited(now - 3001, now)).toBe(false);
    expect(isRateLimited(now - 5000, now)).toBe(false);
  });

  it('detects honeypot field usage', () => {
    expect(
      isHoneypotTriggered({
        name: 'Bot',
        phone: '12345678',
        email: '',
        projectType: '',
        location: '',
        message: 'Spam text message',
        _gotcha: 'I am a bot',
      }),
    ).toBe(true);

    expect(
      isHoneypotTriggered({
        name: 'Real User',
        phone: '12345678',
        email: '',
        projectType: '',
        location: '',
        message: 'Valid project enquiry message',
        _gotcha: '',
      }),
    ).toBe(false);
  });
});
