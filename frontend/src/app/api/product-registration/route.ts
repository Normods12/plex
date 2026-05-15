import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface RegistrationData {
  name: string;
  email: string;
  productModel: string;
  serialNumber: string;
  purchaseDate: string;
  retailer?: string;
}

function validate(data: Partial<RegistrationData>): string | null {
  if (!data.name?.trim()) return 'Name is required';
  if (!data.email?.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Invalid email address';
  if (!data.productModel?.trim()) return 'Product model is required';
  if (!data.serialNumber?.trim()) return 'Serial number is required';
  if (!data.purchaseDate?.trim()) return 'Purchase date is required';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RegistrationData>;

    const error = validate(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const { name, email, productModel, serialNumber, purchaseDate, retailer } =
      body as RegistrationData;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Plexonics Website" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || 'info@plexonics.com',
      replyTo: email,
      subject: `Product Registration: ${productModel} — ${name}`,
      text: `
Product Registration

Name: ${name}
Email: ${email}
Product Model: ${productModel}
Serial Number: ${serialNumber}
Purchase Date: ${purchaseDate}
${retailer ? `Retailer: ${retailer}` : ''}
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/product-registration] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit registration. Please try again.' },
      { status: 500 }
    );
  }
}
