import { OCR_SPACE_API_KEY } from '../constants';
import { readAsStringAsync, EncodingType, writeAsStringAsync, documentDirectory, makeDirectoryAsync } from 'expo-file-system';

export interface ReceiptData {
  date: string;
  title: string;
  mobile?: string;
  amount: string;
  description: string;
  type: "Expense" | "Income";
}

export async function scanReceipt(imageUri: string): Promise<ReceiptData> {
  // Convert image to base64 using expo-file-system
  const base64 = await readAsStringAsync(imageUri, {
    encoding: EncodingType.Base64,
  });

  // OCR.space API request
  const formData = new FormData();
  formData.append('apikey', OCR_SPACE_API_KEY);
  formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
  formData.append('language', 'eng');
  formData.append('isCreateSearchablePdf', 'false');
  formData.append('isSearchablePdfHideTextLayer', 'true');

  const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  });

  if (!ocrResponse.ok) {
    throw new Error(`OCR API request failed: ${ocrResponse.status} ${ocrResponse.statusText}`);
  }

  const ocrData = await ocrResponse.json();
  if (!ocrData.IsErroredOnProcessing && ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
    const text = ocrData.ParsedResults[0].ParsedText;
    if (!text || text.trim() === '') {
      throw new Error("No text detected in the image. Please ensure the receipt is clear and well-lit.");
    }
    // Parse the text
    const parsedData = parseReceiptText(text);

    // Write output JSON file to OCR-reciept folder
    const outputDir = documentDirectory + 'OCR-reciept/';
    await makeDirectoryAsync(outputDir, { intermediates: true });
    const outputPath = outputDir + 'output.json';
    await writeAsStringAsync(outputPath, JSON.stringify(parsedData, null, 2), { encoding: EncodingType.UTF8 });

    return parsedData;
  } else {
    throw new Error("OCR processing failed: " + (ocrData.ErrorMessage || "Unknown error"));
  }
}



function parseReceiptText(text: string): ReceiptData {
  // Simple regex parsing - can be improved based on receipt formats

  // Date: Match DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})|(\d{4}[\-\/]\d{2}[\-\/]\d{2})/;
  const dateMatch = text.match(dateRegex);
  const date = dateMatch ? dateMatch[0] : '';

  // Amount: Look for lines with keywords like total, amount, payable, etc.
  let amount = '';
  const keywords = ['total amount', 'total', 'amount', 'payable', 'grand total', 'net amount', 'balance due'];
  const linesArr = text.split('\n').map(line => line.trim()).filter(line => line);
  for (const line of linesArr.reverse()) { // Start from bottom
    const lowerLine = line.toLowerCase();
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      const amountRegex = /[\$₹€£]?\d+(\.\d{2})?/;
      const match = line.match(amountRegex);
      if (match) {
        amount = match[0].replace(/[\$₹€£]/g, ''); // Remove currency symbols
        break;
      }
    }
  }
  // Fallback to any number if no keyword found
  if (!amount) {
    const amountRegex = /[\$₹€£]?\d+(\.\d{2})?/;
    const match = text.match(amountRegex);
    if (match) {
      amount = match[0].replace(/[\$₹€£]/g, '');
    }
  }

  // Mobile: Match 10 digit number or with country code
  const mobileRegex = /(\+?\d{1,3}[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/;
  const mobileMatch = text.match(mobileRegex);
  const mobile = mobileMatch ? mobileMatch[0] : undefined;

  // Title: Assume first line or match common words
  const titleLines = text.split('\n').filter(line => line.trim());
  const title = titleLines[0] || 'Receipt';

  // Description: Full text
  const description = text;

  // Detect type: look for credit keywords
  const lowerDesc = description.toLowerCase();
  const creditKeywords = ["credit", "deposit", "received", "payment received", "refund"];
  const isCredit = creditKeywords.some((kw) => lowerDesc.includes(kw));
  const type: "Expense" | "Income" = isCredit ? "Income" : "Expense";

  return {
    date,
    title,
    mobile,
    amount,
    description,
    type,
  };
}
