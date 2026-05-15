'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type EnquiryType = 'General' | 'Support' | 'Partnership' | 'Careers';

interface FormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  enquiryType: EnquiryType | '';
  message: string;
}

const ENQUIRY_TYPES: EnquiryType[] = ['General', 'Support', 'Partnership', 'Careers'];

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    company: '',
    email: '',
    phone: '',
    enquiryType: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      setStatus('success');
      setForm({ name: '', company: '', email: '', phone: '', enquiryType: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Contact Us</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">Contact Us</h1>
          <p className="text-gray-300 mt-2">
            Get in touch with our team for sales, support, or partnership enquiries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-ui-nearBlack mb-6">Get in Touch</h2>

            <div className="space-y-5 mb-8">
              <ContactInfoItem
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                }
                label="Phone"
              >
                <a
                  href="tel:18001200023"
                  className="text-brand-red hover:underline font-bold"
                >
                  1800-1200-023
                </a>
                <span className="text-xs text-gray-500 block">Toll-free · Mon–Sat 9am–6pm IST</span>
              </ContactInfoItem>

              <ContactInfoItem
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                }
                label="Email"
              >
                <a
                  href="mailto:info@plexonics.com"
                  className="text-brand-red hover:underline font-bold"
                >
                  info@plexonics.com
                </a>
              </ContactInfoItem>

              <ContactInfoItem
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                }
                label="Address"
              >
                <span className="text-ui-charcoal text-sm">
                  Plexonics Technologies Limited<br />
                  India
                </span>
              </ContactInfoItem>
            </div>

            {/* Map embed placeholder */}
            <div className="w-full h-64 bg-ui-lightGray border border-ui-border rounded-sm flex items-center justify-center">
              <p className="text-gray-400 text-sm">Map will be embedded here</p>
            </div>
          </div>

          {/* Right: Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-ui-nearBlack mb-6">Send a Message</h2>

            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-sm p-8 text-center">
                <div className="text-4xl mb-4" aria-hidden="true">✅</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent</h3>
                <p className="text-green-700 mb-6">
                  Thank you for reaching out. We will get back to you within 1–2 business days.
                </p>
                <Button onClick={() => setStatus('idle')} variant="outline">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                  <InputField
                    label="Company"
                    name="company"
                    type="text"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Your company"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                  />
                  <InputField
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label
                    htmlFor="enquiryType"
                    className="block text-sm font-bold text-ui-nearBlack mb-1.5"
                  >
                    Type of Enquiry
                    <span className="text-brand-red ml-1" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="enquiryType"
                    name="enquiryType"
                    value={form.enquiryType}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2.5 border border-ui-border rounded-sm text-sm text-ui-charcoal focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-colors bg-white"
                  >
                    <option value="">Select enquiry type</option>
                    {ENQUIRY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-bold text-ui-nearBlack mb-1.5"
                  >
                    Message
                    <span className="text-brand-red ml-1" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    rows={5}
                    placeholder="How can we help you?"
                    className="w-full px-3 py-2.5 border border-ui-border rounded-sm text-sm text-ui-charcoal focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-colors resize-none"
                  />
                </div>

                {/* hCaptcha placeholder */}
                <div className="bg-ui-lightGray border border-ui-border rounded-sm p-3 text-xs text-gray-500">
                  hCaptcha will be rendered here. Add your site key to enable spam protection.
                </div>

                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full"
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactInfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-brand-red text-white rounded-sm flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  type,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-bold text-ui-nearBlack mb-1.5">
        {label}
        {required && <span className="text-brand-red ml-1" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-ui-border rounded-sm text-sm text-ui-charcoal focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-colors"
      />
    </div>
  );
}
