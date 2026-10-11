import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Sheet } from '../../components/SheetStack';
import { CONTACT_CONFIG, CONTACT_CONTENT } from '../../content/contact';
import { SERVICES_CONTENT } from '../../content/services';
import { useScroll } from '../../hooks/useScroll';
import {
  isHoneypotTriggered,
  isRateLimited,
  validateContactField,
  validateContactForm,
  type ContactFormData,
  type ValidationErrors,
} from '../../lib/contactForm';
import './Contact.css';

const INITIAL_FORM_DATA: ContactFormData = {
  name: '',
  phone: '',
  email: '',
  projectType: SERVICES_CONTENT.services[0]?.name ?? 'Commercial',
  location: '',
  message: '',
  _gotcha: '',
};

export function Contact() {
  const formspreeId = import.meta.env.VITE_FORMSPREE_ID?.trim() || '';
  const isMissingConfig = !formspreeId;
  const { scrollTo } = useScroll();

  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const lastSubmitTimeRef = useRef<number>(0);
  const successRegionRef = useRef<HTMLDivElement | null>(null);

  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const projectTypeId = useId();
  const locationId = useId();
  const messageId = useId();

  const handleBlur = (field: keyof ContactFormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateContactField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateContactField(name as keyof ContactFormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isMissingConfig) {
      setLiveAnnouncement('Submissions disabled in non-production environment.');
      return;
    }

    // Double-submit and rate guard (3 seconds cooldown)
    if (isSubmitting || isRateLimited(lastSubmitTimeRef.current)) {
      return;
    }
    lastSubmitTimeRef.current = Date.now();

    // Honeypot check (bot submission dropped silently without network call)
    if (isHoneypotTriggered(formData)) {
      setStatus('success');
      return;
    }

    const validationErrors = validateContactForm(formData);
    setErrors(validationErrors);
    setTouched({
      name: true,
      phone: true,
      email: true,
      projectType: true,
      location: true,
      message: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstKey = Object.keys(validationErrors)[0];
      const errorMsg = firstKey ? validationErrors[firstKey as keyof ValidationErrors] : '';
      setLiveAnnouncement(`Form has errors. ${errorMsg ?? ''}`);

      // Focus first invalid field
      const firstInvalidElement = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[name="${firstKey}"]`,
      );
      if (firstInvalidElement) {
        firstInvalidElement.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setLiveAnnouncement('Sending enquiry...');

    try {
      const body = new FormData();
      body.append('name', formData.name);
      body.append('phone', formData.phone);
      if (formData.email) body.append('email', formData.email);
      body.append('projectType', formData.projectType);
      if (formData.location) body.append('location', formData.location);
      body.append('message', formData.message);

      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error('Formspree response not OK');
      }

      setStatus('success');
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setTouched({});
      setLiveAnnouncement('Enquiry sent successfully.');

      // Move focus to confirmation region
      requestAnimationFrame(() => {
        successRegionRef.current?.focus();
      });
    } catch {
      setStatus('error');
      setLiveAnnouncement('Unable to send enquiry. Please contact us directly by phone or email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollTo('#hero');
    if (window.location.hash !== '#hero') {
      history.replaceState(null, '', '#hero');
    }
  };

  const handleResetForm = () => {
    setStatus('idle');
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  };

  return (
    <Sheet
      id={CONTACT_CONTENT.sectionId}
      label={CONTACT_CONTENT.kicker}
      headingTag="span"
      tone="light"
      className="contact-sheet"
    >
      <div className="container contact-content">
        <div className="contact-grid">
          {/* Left Column: Headline, subhead, ruled channels */}
          <div className="contact-left-col">
            <header className="contact-header">
              <span className="contact-kicker">{CONTACT_CONTENT.kicker}</span>
              <h2 id="contact-title" className="contact-headline">
                {CONTACT_CONTENT.headline}
              </h2>
              <p className="contact-subhead">{CONTACT_CONTENT.subhead}</p>
            </header>

            <ul className="contact-channels-list" aria-label="Direct contact channels">
              {CONTACT_CONTENT.channels.map((ch) => (
                <li key={ch.id} className="contact-channel-item">
                  <span className="contact-channel-label">{ch.label}</span>
                  {ch.href ? (
                    <a
                      href={ch.href}
                      className="contact-channel-value"
                      target={ch.href.startsWith('https://') ? '_blank' : undefined}
                      rel={ch.href.startsWith('https://') ? 'noopener noreferrer' : undefined}
                    >
                      {ch.value}
                    </a>
                  ) : (
                    <span className="contact-channel-value">{ch.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Enquiry Form & States */}
          <div className="contact-form-col">
            {/* Live announcements region for screen readers */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {liveAnnouncement}
            </div>

            {isMissingConfig && (
              <div role="alert" className="contact-config-warning">
                {
                  '// Non-production environment: Form submissions are disabled because VITE_FORMSPREE_ID is not configured.'
                }
              </div>
            )}

            {status === 'error' && (
              <div role="alert" className="contact-status-error">
                Unable to deliver your enquiry right now. Please call us at{' '}
                <a href={`tel:${CONTACT_CONFIG.rawPhone}`}>{CONTACT_CONFIG.displayPhone}</a> or
                email <a href={`mailto:${CONTACT_CONFIG.email}`}>{CONTACT_CONFIG.email}</a>{' '}
                directly.
              </div>
            )}

            {status === 'success' ? (
              <div
                ref={successRegionRef}
                tabIndex={-1}
                role="status"
                className="contact-status-success"
              >
                <h3 className="contact-success-title">Enquiry Delivered</h3>
                <p className="contact-success-body">
                  Thank you. Your project enquiry has been delivered directly to our desk. Our site
                  team reviews all specifications and will follow up within two business days.
                </p>
                <button type="button" className="contact-success-reset" onClick={handleResetForm}>
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form id="contact-form" noValidate onSubmit={handleSubmit} className="contact-form">
                {/* Honeypot field for bot protection */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    opacity: 0,
                    height: 0,
                    width: 0,
                    overflow: 'hidden',
                  }}
                  aria-hidden="true"
                >
                  <label htmlFor="contact-gotcha">Do not fill this field</label>
                  <input
                    id="contact-gotcha"
                    name="_gotcha"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData._gotcha}
                    onChange={handleChange}
                  />
                </div>

                {/* Name Field */}
                <div className="contact-field-group">
                  <label htmlFor={nameId} className="contact-label">
                    <span>Name</span>
                    <span className="field-required">required</span>
                  </label>
                  <input
                    id={nameId}
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    aria-describedby={errors.name ? `${nameId}-error` : undefined}
                    aria-invalid={errors.name ? 'true' : 'false'}
                    className={`contact-input ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur('name')}
                  />
                  {errors.name && (
                    <span id={`${nameId}-error`} className="field-error-msg" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                {/* Phone Field */}
                <div className="contact-field-group">
                  <label htmlFor={phoneId} className="contact-label">
                    <span>Phone</span>
                    <span className="field-required">required</span>
                  </label>
                  <input
                    id={phoneId}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    autoComplete="tel"
                    aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    className={`contact-input ${errors.phone ? 'is-invalid' : ''}`}
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur('phone')}
                  />
                  {errors.phone && (
                    <span id={`${phoneId}-error`} className="field-error-msg" role="alert">
                      {errors.phone}
                    </span>
                  )}
                </div>

                {/* Email Field */}
                <div className="contact-field-group">
                  <label htmlFor={emailId} className="contact-label">
                    <span>Email</span>
                    <span className="field-optional">optional</span>
                  </label>
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    aria-describedby={errors.email ? `${emailId}-error` : undefined}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    className={`contact-input ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur('email')}
                  />
                  {errors.email && (
                    <span id={`${emailId}-error`} className="field-error-msg" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Project Type Select */}
                <div className="contact-field-group">
                  <label htmlFor={projectTypeId} className="contact-label">
                    <span>Project type</span>
                    <span className="field-required">required</span>
                  </label>
                  <select
                    id={projectTypeId}
                    name="projectType"
                    required
                    className="contact-select"
                    value={formData.projectType}
                    onChange={handleChange}
                  >
                    {SERVICES_CONTENT.services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="Other">Other / Custom Construction</option>
                  </select>
                </div>

                {/* Location Field */}
                <div className="contact-field-group">
                  <label htmlFor={locationId} className="contact-label">
                    <span>Project location</span>
                    <span className="field-optional">optional</span>
                  </label>
                  <input
                    id={locationId}
                    name="location"
                    type="text"
                    autoComplete="address-level2"
                    className="contact-input"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                {/* Message Field */}
                <div className="contact-field-group">
                  <label htmlFor={messageId} className="contact-label">
                    <span>Project description</span>
                    <span className="field-required">required</span>
                  </label>
                  <textarea
                    id={messageId}
                    name="message"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    aria-describedby={errors.message ? `${messageId}-error` : undefined}
                    aria-invalid={errors.message ? 'true' : 'false'}
                    className={`contact-textarea ${errors.message ? 'is-invalid' : ''}`}
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur('message')}
                  />
                  {errors.message && (
                    <span id={`${messageId}-error`} className="field-error-msg" role="alert">
                      {errors.message}
                    </span>
                  )}
                </div>

                <p className="contact-privacy-note">{CONTACT_CONTENT.privacyNotice}</p>

                <button
                  type="submit"
                  disabled={isSubmitting || isMissingConfig}
                  className="contact-submit-btn"
                >
                  {isSubmitting ? 'Sending' : 'Send enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="contact-footer" aria-label="Site footer">
          <div className="contact-footer-inner">
            <span className="contact-footer-copy">
              © {new Date().getFullYear()} {CONTACT_CONTENT.footer.companyName}
            </span>
            <span className="contact-footer-credit">{CONTACT_CONTENT.footer.builtBy}</span>
            <a href="#hero" className="contact-footer-top" onClick={handleBackToTop}>
              {CONTACT_CONTENT.footer.backToTopLabel}
            </a>
          </div>
        </footer>
      </div>
    </Sheet>
  );
}
