import nodemailer from "nodemailer";

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    servername: process.env.SMTP_HOST,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const attachments = params.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      encoding: "base64",
      contentType: att.type,
    }));

    await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments,
    });

    return true;
  } catch (error: any) {
    console.error("SMTP email error:", error.message);
    return false;
  }
}

export async function sendContractEmails(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  pdfBuffer: Buffer,
): Promise<{ customerSent: boolean; ownerSent: boolean }> {
  const pdfBase64 = pdfBuffer.toString("base64");

  const customerEmailParams: EmailParams = {
    to: customerEmail,
    from: process.env.SMTP_USER || "honza@pujcovnaoutdooru.cz",
    subject: `Potvrzení rezervace outdoorového vybavení - ${orderNumber}`,
    html: `
      <p>Ahoj!</p>
      <p>Děkuji za objednávku! Rezervace vybavení číslo <strong>${orderNumber}</strong> byla úspěšně vytvořena.</p>
      <p>V příloze najdeš smlouvu o vypůjčení vybavení, kterou podepíšeme při předání.</p>
      <h3>Důležité informace:</h3>
      <ul>
        <li>Kontaktujte mě prosím pro upřesnění místa a času předání.</li>
      </ul>
      <p>Kontakt: +420 734 415 950 nebo honza@pujcovnaoutdooru.cz</p>
      <p> </p>
      <p>Honza</p>
      <p>www.pujcovnaoutdooru.cz</p>
    `,
    text: `Děkuji za objednávku!

Rezervace vybavení číslo ${orderNumber} byla úspěšně vytvořena.
V příloze najdeš smlouvu o vypůjčení vybavení, kterou podepíšeme při předání.

Kontakt: +420 734 415 950 nebo honza@pujcovnaoutdooru.cz

Honza
www.pujcovnaoutdooru.cz`,
    attachments: [
      {
        content: pdfBase64,
        filename: `smlouva-${orderNumber}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };

  const ownerEmailParams: EmailParams = {
    to: "honza@pujcovnaoutdooru.cz",
    from: process.env.SMTP_USER || "honza@pujcovnaoutdooru.cz",
    subject: `Nová rezervace - ${orderNumber}`,
    html: `
      <h2>Nová objednávka byla vytvořena</h2>
      <p><strong>Číslo objednávky:</strong> ${orderNumber}</p>
      <p><strong>Zákazník:</strong> ${customerName}</p>
      <p><strong>Email zákazníka:</strong> ${customerEmail}</p>
    `,
    text: `Číslo objednávky: ${orderNumber}
Zákazník: ${customerName}
Email zákazníka: ${customerEmail}

V příloze najdete smlouvu o vypůjčení vybavení.`,
    attachments: [
      {
        content: pdfBase64,
        filename: `smlouva-${orderNumber}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };

  const customerSent = await sendEmail(customerEmailParams);
  const ownerSent = await sendEmail(ownerEmailParams);

  return { customerSent, ownerSent };
}
