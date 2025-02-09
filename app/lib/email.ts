import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  template: string;
  data: {
    otp?: string;
    verifyUrl?: string;
    expiresIn?: string;
    [key: string]: unknown;
  };
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

const templates = {
  'signup-otp': {
    subject: 'Verify your email',
    html: (data: EmailOptions['data']) => `
      <h1>Welcome!</h1>
      <p>Your verification code is: <strong>${data.otp}</strong></p>
      <p>Or click this link: <a href="${data.verifyUrl}">${data.verifyUrl}</a></p>
      <p>Code expires in ${data.expiresIn}</p>
    `
  },
  'login-otp': {
    subject: 'Login verification code',
    html: (data: EmailOptions['data']) => `
      <h1>Login Verification</h1>
      <p>Your login code is: <strong>${data.otp}</strong></p>
      <p>Or click this link: <a href="${data.verifyUrl}">${data.verifyUrl}</a></p>
      <p>Code expires in ${data.expiresIn}</p>
    `
  }
};

export async function sendEmail({ to, template, data }: EmailOptions) {
  const emailTemplate = templates[template as keyof typeof templates];
  
  if (!emailTemplate) {
    throw new Error(`Template ${template} not found`);
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: emailTemplate.subject,
    html: emailTemplate.html(data)
  };

  // Allow skipping email sending in development
  const skipEmail = process.env.SKIP_EMAIL_IN_DEV === 'true' && process.env.NODE_ENV === 'development';

  if (skipEmail) {
    console.log('Development mode - skipping email send');
    console.log('Email details:', {
      to,
      subject: mailOptions.subject,
      verificationUrl: data.verifyUrl,
      otp: data.otp
    });
    return { success: true };
  }

  // Actually send the email in production or if SKIP_EMAIL_IN_DEV is false
  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('Email details that would have been sent:', {
        to,
        subject: mailOptions.subject,
        verificationUrl: data.verifyUrl,
        otp: data.otp
      });
    }
    throw error;
  }
} 