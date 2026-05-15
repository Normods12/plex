import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface ContactFormData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  enquiryType: string;
  message: string;
}

function validateContactForm(data: Partial<ContactFormData>): string | null {
  if (!data.name?.trim()) return 'Name is required';
  if (!data.email?.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Invalid email address';
  if (!data.enquiryType?.trim()) return 'Enquiry type is required';
  if (!data.message?.trim()) return 'Message is required';
  if (data.message.trim().length < 10) return 'Message must be at least 10 characters';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ContactFormData>;

    // Validate
    const validationError = validateContactForm(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, company, email, phone, enquiryType, message } = body as ContactFormData;

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #DC2127; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
        </div>
        <div style="padding: 24px; background: #f8f9fa; border: 1px solid #ddd;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333; width: 140px;">Name:</td>
              <td style="padding: 8px 0; color: #555;">${escapeHtml(name)}</td>
            </tr>
            ${company ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Company:</td><td style="padding: 8px 0; color: #555;">${escapeHtml(company)}</td></tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 8px 0; color: #555;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            ${phone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Phone:</td><td style="padding: 8px 0; color: #555;">${escapeHtml(phone)}</td></tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Enquiry Type:</td>
              <td style="padding: 8px 0; color: #555;">${escapeHtml(enquiryType)}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #ddd;">
            <p style="font-weight: bold; color: #333; margin: 0 0 8px;">Message:</p>
            <p style="color: #555; white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
          </div>
        </div>
        <div style="padding: 12px 24px; background: #1a1a1a; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            Sent from plexonics.com contact form
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Plexonics Website" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || 'info@plexonics.com',
      replyTo: email,
      subject: `[${enquiryType}] Contact form: ${name}`,
      html: emailHtml,
      text: `
Name: ${name}
${company ? `Company: ${company}\n` : ''}Email: ${email}
${phone ? `Phone: ${phone}\n` : ''}Enquiry Type: ${enquiryType}

Message:
${message}
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/contact] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
