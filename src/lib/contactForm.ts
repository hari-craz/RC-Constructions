/**
 * Validation and security helpers for the Contact enquiry form.
 * No logging or persistence of form values.
 */

export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  projectType: string;
  location: string;
  message: string;
  _gotcha: string;
}

export interface ValidationErrors {
  name?: string;
  phone?: string;
  email?: string;
  projectType?: string;
  location?: string;
  message?: string;
}

export function validateContactField(
  name: keyof ContactFormData,
  value: string,
): string | undefined {
  const trimmed = value.trim();

  switch (name) {
    case 'name':
      if (!trimmed) {
        return 'Please enter your name.';
      }
      if (trimmed.length < 2) {
        return 'Name must be at least 2 characters.';
      }
      return undefined;

    case 'phone': {
      if (!trimmed) {
        return 'Please enter your telephone number.';
      }
      const digitsOnly = trimmed.replace(/\D/g, '');
      if (digitsOnly.length < 7 || !/^[\d\s+\-()]{7,25}$/.test(trimmed)) {
        return 'Please enter a valid telephone number.';
      }
      return undefined;
    }

    case 'email':
      if (!trimmed) {
        return undefined; // Email is optional
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return 'Please enter a valid email address.';
      }
      return undefined;

    case 'message':
      if (!trimmed) {
        return 'Please describe your project.';
      }
      if (trimmed.length < 10) {
        return 'Project description must be at least 10 characters.';
      }
      if (trimmed.length > 2000) {
        return 'Project description must not exceed 2000 characters.';
      }
      return undefined;

    default:
      return undefined;
  }
}

export function validateContactForm(data: ContactFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  const nameError = validateContactField('name', data.name);
  if (nameError) errors.name = nameError;

  const phoneError = validateContactField('phone', data.phone);
  if (phoneError) errors.phone = phoneError;

  const emailError = validateContactField('email', data.email);
  if (emailError) errors.email = emailError;

  const messageError = validateContactField('message', data.message);
  if (messageError) errors.message = messageError;

  return errors;
}

export function isRateLimited(
  lastSubmitTime: number,
  now = Date.now(),
  cooldownMs = 3000,
): boolean {
  if (lastSubmitTime <= 0) return false;
  return now - lastSubmitTime < cooldownMs;
}

export function isHoneypotTriggered(data: ContactFormData): boolean {
  return Boolean(data._gotcha && data._gotcha.trim().length > 0);
}
