import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { calculateBillableDays } from "@shared/utils";
import fs from "fs";
import path from "path";

interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerIdNumber?: string;
  pickupLocation: string;
  dateFrom: string;
  dateTo: string;
  totalPrice: number;
  totalDeposit: number;
  items: Array<{
    name: string;
    quantity: number;
    dailyPrice: number;
    deposit: number;
    totalPrice: number;
  }>;
}

// PDF layout constants
const PDF_MARGINS = { left: 15, right: 15, top: 15, bottom: 15 };
const PDF_WIDTH = 210; // A4 width in mm
const PDF_HEIGHT = 297; // A4 height in mm
const CONTENT_WIDTH = PDF_WIDTH - PDF_MARGINS.left - PDF_MARGINS.right;
const MAX_Y_POSITION = PDF_HEIGHT - PDF_MARGINS.bottom; // Maximum Y position before page break

// Color scheme
const COLORS = {
  primary: "#2D5A27", // Dark green
  secondary: "#4A7C59", // Medium green
  accent: "#6B9C6B", // Light green
  text: "#2C3E50", // Dark gray
  light: "#ECF0F1", // Light gray
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("cs-CZ");
}

function formatPrice(priceInCents: number): string {
  return `${(priceInCents / 1).toFixed(2)} Kč`;
}

// Function to check if page break is needed and handle it
async function checkPageBreak(
  doc: jsPDF,
  yPos: number,
  requiredSpace: number = 20,
): Promise<number> {
  if (yPos + requiredSpace > MAX_Y_POSITION) {
    doc.addPage();

    // Add logo and header to new page
    await addLogo(doc, PDF_MARGINS.left, PDF_MARGINS.top);

    let newYPos = PDF_MARGINS.top + 28; // Same spacing as first page

    // Add horizontal line under header
    doc.setDrawColor(COLORS.text);
    doc.setLineWidth(0.5);
    doc.line(PDF_MARGINS.left, newYPos, PDF_WIDTH - PDF_MARGINS.right, newYPos);

    return newYPos + 8; // Return position after header and line
  }
  return yPos;
}

// Function to render Czech text with proper character handling
function renderCzechText(doc: jsPDF, text: string, x: number, y: number): void {
  try {
    // Ensure proper parameter types for jsPDF.text()
    const textString = String(text);
    const xPos = Number(x);
    const yPos = Number(y);

    doc.text(textString, xPos, yPos);
  } catch (error) {
    // Fallback to basic text rendering with string conversion
    try {
      doc.text(String(text), Number(x), Number(y));
    } catch (fallbackError) {
      // Last resort: use a simple text
      doc.text("Error rendering text", Number(x), Number(y));
    }
  }
}

async function addLogo(doc: jsPDF, x: number, y: number): Promise<void> {
  try {
    // Load the actual logo file
    const logoPath = path.join(
      process.cwd(),
      "client",
      "public",
      "uploads",
      "logo-pujcovnaoutdooru-cz.png",
    );

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      const logoDataUrl = `data:image/png;base64,${logoBase64}`;

      // Add the logo image to PDF
      doc.addImage(logoDataUrl, "PNG", x, y, 18, 18);

      // Add company name text next to logo
      doc.setFontSize(20);
      doc.setFont("OpenSans", "bold");
      doc.setTextColor(COLORS.text);
      renderCzechText(doc, "PUJCOVNAOUTDOORU.CZ", x + 21, y + 17); //posun loga
    } else {
      // Fallback to text-only logo if file not found
      doc.setFontSize(20);
      doc.setFont("OpenSans", "normal");
      doc.setTextColor(COLORS.text);
      renderCzechText(doc, "PUJCOVNAOUTDOORU.CZ", x, y + 18);
    }
  } catch (error) {
    // Fallback to text-only logo if any error occurs
    doc.setFontSize(20);
    doc.setFont("OpenSans", "normal");
    doc.setTextColor(COLORS.text);
    renderCzechText(doc, "PUJCOVNAOUTDOORU.CZ", x, y + 18);
  }
}

async function addHeader(
  doc: jsPDF,
  data: InvoiceData,
  yPos: number,
): Promise<number> {
  // Add company logo and name at the top
  await addLogo(doc, PDF_MARGINS.left, yPos);

  yPos += 28;

  // Contract title
  doc.setFontSize(14);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "Smlouva o vypůjčení vybavení", PDF_MARGINS.left, yPos);

  yPos += 8;

  // Contract number
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  renderCzechText(
    doc,
    `Číslo smlouvy: ${data.orderNumber}`,
    PDF_MARGINS.left,
    yPos,
  );

  yPos += 7;

  // Add horizontal line
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.5);
  doc.line(PDF_MARGINS.left, yPos, PDF_WIDTH - PDF_MARGINS.right, yPos);

  return yPos + 8;
}

function addPartyInfo(doc: jsPDF, data: InvoiceData, yPos: number): number {
  const midPoint = PDF_MARGINS.left + CONTENT_WIDTH / 2;

  // Headers
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "PRONAJÍMATEL:", PDF_MARGINS.left, yPos);
  renderCzechText(doc, "NÁJEMCE:", midPoint, yPos);

  yPos += 6;
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);

  // Company info (left)
  const companyInfo = [
    "Jan Rücker",
    "17. listopadu 1215/2b",
    "779 00 Olomouc",
    "IČ: 02938316",
    "Tel.: 606 476 399",
    "Nejsem plátce DPH",
  ];

  // Customer info (right)
  const customerInfo = [
    data.customerName,
    data.customerAddress || "",
    data.customerPhone,
    data.customerEmail,
    "Číslo OP:",
  ];

  for (let i = 0; i < Math.max(companyInfo.length, customerInfo.length); i++) {
    if (companyInfo[i])
      renderCzechText(doc, companyInfo[i], PDF_MARGINS.left, yPos);
    if (customerInfo[i]) renderCzechText(doc, customerInfo[i], midPoint, yPos);
    yPos += 5;
  }

  return yPos + 8;
}

function addRentalPeriod(doc: jsPDF, data: InvoiceData, yPos: number): number {
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "DOBA NÁJMU:", PDF_MARGINS.left, yPos);

  yPos += 5;
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);

  renderCzechText(
    doc,
    `Smlouva se uzavírá na dobu určitou od: ${formatDate(data.dateFrom)} do: ${formatDate(data.dateTo)}`,
    PDF_MARGINS.left,
    yPos,
  );

  return yPos + 10;
}

async function addItemsTable(
  doc: jsPDF,
  data: InvoiceData,
  yPos: number,
): Promise<number> {
  const days = calculateBillableDays(data.dateFrom, data.dateTo);

  // section header
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "PŘEDMĚT SMLOUVY:", PDF_MARGINS.left, yPos);

  yPos += 3;

  // Table header with gray background
  doc.setFillColor(240, 240, 240);
  doc.rect(PDF_MARGINS.left, yPos, CONTENT_WIDTH, 8, "F");

  doc.setFontSize(9);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);

  const headers = ["Vybavení", "Ks", "Cena/den", "Dnů", "Půjčovné", "Záloha"];
  const colWidths = [70, 12, 25, 12, 25, 25];
  let xPos = PDF_MARGINS.left + 2;

  headers.forEach((header, i) => {
    renderCzechText(doc, header, xPos, yPos + 5);
    xPos += colWidths[i];
  });

  yPos += 8;

  // Table rows
  doc.setTextColor(COLORS.text);
  doc.setFont("OpenSans", "normal");

  let totalRental = 0;
  let totalDeposit = 0;

  for (let index = 0; index < data.items.length; index++) {
    const item = data.items[index];
    // Check if we need a page break before adding this row
    yPos = await checkPageBreak(doc, yPos, 10);

    const rentalPrice = item.dailyPrice * item.quantity * days;
    const depositTotal = item.deposit * item.quantity;
    totalRental += rentalPrice;
    totalDeposit += depositTotal;

    // Draw border for each row
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.rect(PDF_MARGINS.left, yPos, CONTENT_WIDTH, 6, "S");

    xPos = PDF_MARGINS.left + 2;
    const rowData = [
      item.name.substring(0, 30),
      item.quantity.toString(),
      formatPrice(item.dailyPrice),
      days.toString(),
      formatPrice(rentalPrice),
      formatPrice(depositTotal),
    ];

    rowData.forEach((data, i) => {
      renderCzechText(doc, data, xPos, yPos + 4);
      xPos += colWidths[i];
    });

    yPos += 6;
  }

  yPos += 8;

  // Check if we need a page break before totals
  yPos = await checkPageBreak(doc, yPos, 25);

  // Total amounts
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    `Celkem půjčovné: ${formatPrice(totalRental)}`,
    PDF_MARGINS.left,
    yPos,
  );
  yPos += 6;
  renderCzechText(
    doc,
    `Celkem záloha: ${formatPrice(totalDeposit)}`,
    PDF_MARGINS.left,
    yPos,
  );
  yPos += 8;

  // Final total
  doc.setFont("OpenSans", "bold");
  doc.setFontSize(12);
  renderCzechText(
    doc,
    `CELKEM K ÚHRADĚ: ${formatPrice(totalRental + totalDeposit)}  - placeno převodem / hotově`,
    PDF_MARGINS.left,
    yPos,
  );

  return yPos + 10;
}

function addQRCode(doc: jsPDF, qrCodeDataURL: string, yPos: number): number {
  if (
    qrCodeDataURL &&
    typeof qrCodeDataURL === "string" &&
    qrCodeDataURL.length > 0
  ) {
    try {
      const qrSize = 40;
      const qrX = PDF_WIDTH - PDF_MARGINS.right - qrSize;
      const qrY = Math.max(yPos - 25, PDF_MARGINS.top); // Ensure Y coordinate is valid

      // Validate coordinates
      if (
        qrX > 0 &&
        qrY > 0 &&
        qrX + qrSize <= PDF_WIDTH &&
        qrY + qrSize <= PDF_HEIGHT
      ) {
        doc.addImage(qrCodeDataURL, "PNG", qrX, qrY, qrSize, qrSize);
      }
    } catch (error) {
      // QR code image failed to add, continue without it
    }
  }

  return yPos;
}

// vrácení
function addReturnSection(doc: jsPDF, yPos: number): number {
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "VRÁCENÍ VYBAVENÍ:", PDF_MARGINS.left, yPos);

  yPos += 3;

  const signatureWidth = 60;
  const today = new Date();
  const dateStr = `${today.getDate()}. ${today.getMonth() + 1}. ${today.getFullYear()}`;
  const dateX = PDF_MARGINS.left + signatureWidth + 20;
  const rightLineX = dateX + 40;

  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.2);
  doc.line(PDF_MARGINS.left, yPos, PDF_MARGINS.left + signatureWidth, yPos);
  renderCzechText(doc, dateStr, dateX, yPos - 2);
  doc.line(rightLineX, yPos, rightLineX + signatureWidth, yPos);

  yPos += 5;

  const centerX = PDF_WIDTH / 2;
  doc.setFontSize(9);
  renderCzechText(
    doc,
    "Převzal za PUJCOVNAOUTDOORU.CZ",
    PDF_MARGINS.left,
    yPos,
  );
  renderCzechText(doc, "Datum", centerX, yPos);
  renderCzechText(doc, "Podpis nájemce", rightLineX, yPos);

  return yPos + 10;
}

async function addSignatures(doc: jsPDF, yPos: number): Promise<number> {
  // Check if we need a page break before signatures section
  yPos = await checkPageBreak(doc, yPos, 50);

  // Add rental terms text
  doc.setFontSize(10);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    "Nájemce se zavazuje uhradit částku za nájem zboží a složit zálohu. Zároveň se",
    PDF_MARGINS.left,
    yPos,
  );
  yPos += 5;
  renderCzechText(
    doc,
    "zavazuje vrátit zboží nepoškozeně v tom stavu, v jakém zboží převzal. Svým",
    PDF_MARGINS.left,
    yPos,
  );
  yPos += 5;
  renderCzechText(
    doc,
    "podpisem stvrzuje, že se seznámil se smluvními podmínkami a souhlasí s nimi.",
    PDF_MARGINS.left,
    yPos,
  );

  yPos += 20;

  // Add signature fields
  const signatureWidth = 60;
  const spacing = 15;

  // Draw signature lines
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.3);

  // Left signature line (Rental company)
  doc.line(PDF_MARGINS.left, yPos, PDF_MARGINS.left + signatureWidth, yPos);

  // Date in middle
  const dateX = PDF_MARGINS.left + signatureWidth + spacing;
  doc.line(dateX, yPos, dateX + 35, yPos);

  // Right signature line (Tenant)
  const rightLineX = dateX + 40;
  doc.line(rightLineX, yPos, rightLineX + signatureWidth, yPos);

  yPos += 6;

  // Labels under signature lines
  doc.setFontSize(9);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);

  renderCzechText(doc, "Předal za PŮJČOVNAOUTDOORU.CZ", PDF_MARGINS.left, yPos);
  renderCzechText(doc, "Datum", dateX, yPos);
  renderCzechText(doc, "Převzal - podpis nájemce", rightLineX, yPos);

  yPos += 10;

  // Add horizontal line separator
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGINS.left, yPos, PDF_WIDTH - PDF_MARGINS.right, yPos);

  yPos += 10;

  // RETURN SECTION
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "VRÁCENÍ:", PDF_MARGINS.left, yPos);

  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    "Věc vrácena pronajímateli ve stavu: nepoškozená / poškozená",
    PDF_MARGINS.left,
    yPos,
  );
  yPos += 6;
  renderCzechText(
    doc,
    "Záloha vrácena ve výši: …………………………………… ",
    PDF_MARGINS.left,
    yPos,
  );

  yPos += 10;

  // Return - add signature fields
  const returnSignatureWidth = 60;
  const returnSpacing = 15;

  // Return - signature lines
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.3);

  // Return - left signature line (Rental company)
  doc.line(
    PDF_MARGINS.left,
    yPos,
    PDF_MARGINS.left + returnSignatureWidth,
    yPos,
  );

  // Return - date in middle
  const returnDateX = PDF_MARGINS.left + returnSignatureWidth + returnSpacing;
  doc.line(returnDateX, yPos, returnDateX + 35, yPos);

  // Return - right signature line (Tenant)
  const returnRightLineX = returnDateX + 40;
  doc.line(
    returnRightLineX,
    yPos,
    returnRightLineX + returnSignatureWidth,
    yPos,
  );

  yPos += 6;

  // Return - labels under signature lines
  doc.setFontSize(9);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);

  renderCzechText(
    doc,
    "Převzal za PŮJČOVNAOUTDOORU.CZ",
    PDF_MARGINS.left,
    yPos,
  );
  renderCzechText(doc, "Datum", returnDateX, yPos);
  renderCzechText(doc, "Vrátil - podpis nájemce", returnRightLineX, yPos);

  return yPos + 10;
}

// Obchodni podminky
async function addBusinessTerms(doc: jsPDF, yPos: number): Promise<number> {
  // Check if we need a page break before starting business terms
  yPos = await checkPageBreak(doc, yPos, 50);

  // Add title without line
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "Obchodní podmínky", PDF_MARGINS.left, yPos);

  yPos += 10;

  const terms = [
    "a) Pronajímatel pronajímá nájemci věci uvedené v této smlouvě a nájemce se zavazuje věc užívat za účelem a způsobem, kterým se věc obvykle užívá vzhledem ke své povaze a určení. Obě smluvní strany prohlašují, že věc je předávána a přebírána ve stavu způsobilém k obvyklému užívání.",
    "",
    "b) Nájemní smlouva se uzavírá na dobu určitou, uvedenou v této smlouvě. Nájemce se zavazuje uhradit částku za nájem věci uvedenou v této smlouvě. Nájemné je splatné předem v den uzavření této smlouvy nebo při vrácení zboží.",
    "",
    "c) Zánik smlouvy:",
    "   1) Po navrácení zboží.",
    "   2) Písemně, dohodou obou smluvních stran.",
    "   3) Uplynutím výpovědní lhůty na základě písemné výpovědi z jakéhokoliv důvodu.",
    "Výpovědní lhůta se sjednává desetidenní a začíná běžet od následujícího dne po doručení výpovědi druhé smluvní straně. Ustanovení dle §676, odstavce 2, Občanského zákoníku se neužije.",
    "",
    "d) Nájemce nesmí dát zboží do nájmu třetí osobě a není oprávněn na něm provádět žádné změny.",
    "",
    "e) Nájemce se zavazuje, že se bude o předmět nájemní smlouvy (věci) řádně starat a užívat jej tak, aby nedošlo k jeho poškození, zničení, ztrátě nebo k nepřiměřenému opotřebení.",
    "",
    "f) V případě jakékoliv ztráty nebo úplného zničení věci v době nájmu se nájemce zavazuje uhradit pronajímateli hodnotu věci dle této smlouvy.",
    "",
    "g) V případě poškození věci se nájemce při vrácení věci zavazuje uhradit pronajímateli poměrnou část hodnoty věci, která odpovídá míře poškození. Konkrétní částka bude stanovena při převzetí věci pronajímatelem.",
    "",
    "h) Vrátí-li nájemce zboží po době dohodnuté v nájemní smlouvě, popřípadě po uplynutí výpovědní lhůty, je povinen hradit nájemné až do vrácení zboží a navíc uhradit poplatek z prodlení ve výši denní sazby nájemného za každý den prodlení. V případě ztráty nebo zničení zboží tyto povinnosti nájemce trvají až do doby, kdy zničení nebo ztrátu zboží pronajímateli písemně nahlásí.",
    "",
    "i) Při vrácení věci pronajímateli je nájemce povinen předložit pronajímateli stejnopis nájemní smlouvy, na kterém bude potvrzeno vrácení zboží a jeho stav.",
    "",
    "j) Při vrácení zboží před dohodnutým termínem se nájemné nevrací.",
    "",
    "k) Tato smlouva nabývá platnosti dnem převzetí věci nájemcem. Tato smlouva je vypracována ve dvou stejnopisech, z nichž pronajímatel i nájemce obdrží každý po jednom stejnopise.",
  ];

  doc.setFontSize(10);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);

  for (let index = 0; index < terms.length; index++) {
    const term = terms[index];
    // All text should be normal font and color
    doc.setFont("OpenSans", "normal");
    doc.setTextColor(COLORS.text);

    if (term.trim()) {
      const lines = doc.splitTextToSize(term, CONTENT_WIDTH);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        // Check for page break before each line
        yPos = await checkPageBreak(doc, yPos, 8);
        renderCzechText(doc, line, PDF_MARGINS.left, yPos);
        yPos += 4;
      }
    } else {
      yPos += 4;
    }
  }

  return yPos + 10;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Load OpenSans fonts
    try {
      // Load OpenSans Regular font
      const regularFontPath = path.join(
        process.cwd(),
        "server",
        "OpenSans-Regular.ttf",
      );
      const regularFontBuffer = fs.readFileSync(regularFontPath);
      const regularFontBase64 = regularFontBuffer.toString("base64");

      // Load OpenSans Bold font
      const boldFontPath = path.join(
        process.cwd(),
        "server",
        "OpenSans-Bold.ttf",
      );
      const boldFontBuffer = fs.readFileSync(boldFontPath);
      const boldFontBase64 = boldFontBuffer.toString("base64");

      // Add fonts to jsPDF
      doc.addFileToVFS("OpenSans-Regular.ttf", regularFontBase64);
      doc.addFont("OpenSans-Regular.ttf", "OpenSans", "normal");

      doc.addFileToVFS("OpenSans-Bold.ttf", boldFontBase64);
      doc.addFont("OpenSans-Bold.ttf", "OpenSans", "bold");

      // Set default font to OpenSans
      doc.setFont("OpenSans", "normal");
    } catch (fontError) {
      doc.setFont("Helvetica", "normal");
    }

    // Set character encoding to UTF-8 for better character support
    try {
      doc.setLanguage("cs");
      // Add character space setting for better Czech character rendering
      doc.setCharSpace(0);
    } catch (e) {
      // Language setting not supported
    }

    // Calculate totals for QR code
    const days = calculateBillableDays(data.dateFrom, data.dateTo);
    let totalRental = 0;
    let totalDeposit = 0;

    data.items.forEach((item) => {
      const rentalPrice = item.dailyPrice * item.quantity * days;
      const depositTotal = item.deposit * item.quantity;
      totalRental += rentalPrice;
      totalDeposit += depositTotal;
    });

    const totalAmount = totalRental + totalDeposit;

    // Generate QR code
    let qrCodeDataURL = "";
    try {
      // Use order number if invoice number is not available
      const numberForQR = data.invoiceNumber || data.orderNumber || "000";
      const invoiceNumber =
        numberForQR.replace(/\D/g, "").slice(0, 10) || "000";
      const qrCodeData = `SPD*1.0*ACC:CZ3955000000000857593001*AM:${totalAmount.toFixed(2)}*CC:CZK*X-VS:${invoiceNumber}*MSG:Pujcovnaoutdooru.cz  ${invoiceNumber}`;
      qrCodeDataURL = await QRCode.toDataURL(qrCodeData, { width: 90 });
    } catch (error) {
      // QR code generation failed - continue without QR code
      qrCodeDataURL = "";
    }

    // Build PDF sections
    let yPos = PDF_MARGINS.top;

    yPos = await addHeader(doc, data, yPos);
    yPos = addPartyInfo(doc, data, yPos);
    yPos = addRentalPeriod(doc, data, yPos);
    yPos = await addItemsTable(doc, data, yPos);
    yPos = addQRCode(doc, qrCodeDataURL, yPos);
    yPos = await addSignatures(doc, yPos);
    yPos = await addBusinessTerms(doc, yPos);

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
