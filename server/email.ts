import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SITE_URL = process.env.SITE_URL || "http://localhost:5000";

export function createTransporter() {
  return nodemailer.createTransporter({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName: string
): Promise<void> {
  const transporter = createTransporter();
  const verificationUrl = `${SITE_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"ЭкоМаркет" <${SMTP_USER}>`,
    to: email,
    subject: "Подтверждение email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5f3f;">Добро пожаловать в ЭкоМаркет!</h2>
        <p>Здравствуйте, ${firstName}!</p>
        <p>Спасибо за регистрацию. Пожалуйста, подтвердите ваш email, перейдя по ссылке ниже:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2d5f3f; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Подтвердить email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Или скопируйте эту ссылку в браузер:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 40px;">
          Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.
        </p>
      </div>
    `,
  };

  if (SMTP_USER && SMTP_PASS) {
    await transporter.sendMail(mailOptions);
  } else {
    console.log("Email not configured. Verification link:", verificationUrl);
  }
}
