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
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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

  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - verification details:');
    console.log('URL:', data.verifyUrl);
    console.log('OTP:', data.otp);
    return { success: true };
  }

  await transporter.sendMail(mailOptions);
  return { success: true };
} 