'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ProductRegistrationPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    productModel: '',
    serialNumber: '',
    purchaseDate: '',
    retailer: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/product-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      setStatus('success');
      setFormState({
        name: '',
        email: '',
        productModel: '',
        serialNumber: '',
        purchaseDate: '',
        retailer: '',
      });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Product Registration</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">Product Registration</h1>
          <p className="text-gray-300 mt-2">
            Register your Plexonics product to activate your warranty and receive support.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-sm p-8 text-center">
            <div className="text-4xl mb-4" aria-hidden="true">✅</div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Registration Successful</h2>
            <p className="text-green-700 mb-6">
              Your product has been registered. You will receive a confirmation email shortly.
            </p>
            <Button href="/support" variant="outline">
              Back to Support
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField
              label="Full Name"
              name="name"
              type="text"
              value={formState.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
            />
            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
            <FormField
              label="Product Model"
              name="productModel"
              type="text"
              value={formState.productModel}
              onChange={handleChange}
              required
              placeholder="e.g. PX-SW-2448G"
            />
            <FormField
              label="Serial Number"
              name="serialNumber"
              type="text"
              value={formState.serialNumber}
              onChange={handleChange}
              required
              placeholder="Found on the product label"
            />
            <FormField
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={formState.purchaseDate}
              onChange={handleChange}
              required
            />
            <FormField
              label="Retailer / Reseller"
              name="retailer"
              type="text"
              value={formState.retailer}
              onChange={handleChange}
              placeholder="Where did you purchase this product?"
            />

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
              {status === 'submitting' ? 'Submitting...' : 'Register Product'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function FormField({
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
        placeholder={placeholder}
        aria-required={required}
        className="w-full px-3 py-2.5 border border-ui-border rounded-sm text-sm text-ui-charcoal focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-colors"
      />
    </div>
  );
}
