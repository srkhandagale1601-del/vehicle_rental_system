import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return cachedTransporter;
};

export const sendCancellationOtpEmail = async ({
  to,
  otp,
  bookingId,
  vehicleName,
  startDate,
  endDate,
}) => {
  const transporter = getTransporter();
  if (!transporter) {
    return { delivered: false, message: "SMTP not configured" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to,
    subject: "DriveX booking cancellation OTP",
    text: [
      `Your OTP for cancelling booking #${bookingId} is: ${otp}`,
      `Vehicle: ${vehicleName}`,
      `Dates: ${startDate} to ${endDate}`,
      "This OTP expires in 10 minutes.",
      "If you did not request this, please ignore this email.",
    ].join("\n"),
  });

  return { delivered: true };
};
