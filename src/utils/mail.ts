import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: `"NTB HUB" <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  await resend.emails.send(mailOptions);
};
