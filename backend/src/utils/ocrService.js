const Tesseract = require('tesseract.js');
const ScreenshotUpload = require('../models/ScreenshotUpload');
const Payment = require('../models/Payment');
const Client = require('../models/Client');

/**
 * Process screenshot using Tesseract OCR to extract payment information
 * @param {String} screenshotId - ID of the screenshot upload document
 */
async function processScreenshot(screenshotId) {
  try {
    // Find the screenshot upload record
    const screenshot = await ScreenshotUpload.findById(screenshotId);
    if (!screenshot) {
      throw new Error('Screenshot not found');
    }

    // Update status to processing
    screenshot.status = 'processing';
    await screenshot.save();

    // Perform OCR
    const result = await Tesseract.recognize(
      screenshot.path,
      'eng',
      {
        logger: info => console.log(info)
      }
    );

    // Extract relevant information
    const text = result.data.text;
    const extractedData = extractPaymentInfo(text);
    
    // Update screenshot record with extracted data
    screenshot.extractedData = extractedData;
    screenshot.status = 'processed';
    await screenshot.save();

    // Try to match with existing clients based on amount or patterns
    const matchedClient = await matchClient(extractedData);
    if (matchedClient) {
      screenshot.matchedClientId = matchedClient._id;
      await screenshot.save();
    }

    return screenshot;
  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Update status to error
    const screenshot = await ScreenshotUpload.findById(screenshotId);
    if (screenshot) {
      screenshot.status = 'error';
      await screenshot.save();
    }
    
    throw error;
  }
}

/**
 * Extract payment information from OCR text
 * @param {String} text - OCR extracted text
 * @returns {Object} Extracted payment information
 */
function extractPaymentInfo(text) {
  const data = {};
  
  // Extract amount with improved pattern matching for all UPI providers including PayTM
  // Try multiple approaches for better accuracy
  
  // Approach 1: Enhanced regex pattern
  const enhancedAmountRegex = /(?:₹|rs\.?|inr)[\s]*([\d,]+\.\d{2})|([\d,]+\.\d{2})[\s]*(?:rs\.?|inr|rupees)|(?:paid|amount|total)[\s]*[₹:]?[\s]*([\d,]+\.\d{2})|[₹:]?[\s]*([\d,]+\.\d{2})[\s]*(?:paid|amount|total)/gi;
  
  let amountValue = null;
  const enhancedMatch = text.match(enhancedAmountRegex);
  if (enhancedMatch) {
    // Extract the actual amount value from the match
    for (const match of enhancedMatch) {
      const potentialAmount = match.replace(/[^\d.]/g, '');
      if (potentialAmount && potentialAmount.includes('.')) {
        const parsed = parseFloat(potentialAmount);
        if (!isNaN(parsed) && parsed > 0) {
          amountValue = parsed;
          break;
        }
      }
    }
  }
  
  // Approach 2: Fallback to original pattern if enhanced approach didn't work
  if (!amountValue) {
    const amountRegex = /[₹$]?[\s]*([\d,]+\.?\d*)/;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      amountValue = parseFloat(amountMatch[1].replace(/[,]/g, ''));
    }
  }
  
  // Approach 3: Last resort - look for any decimal number that looks like currency
  if (!amountValue) {
    const decimalNumbers = text.match(/\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?/g);
    if (decimalNumbers) {
      const validAmounts = decimalNumbers
        .map(n => parseFloat(n.replace(/,/g, '')))
        .filter(val => !isNaN(val) && val >= 10 && val <= 10000000) // Reasonable payment range
        .sort((a, b) => b - a); // Sort descending
      
      if (validAmounts.length > 0) {
        amountValue = validAmounts[0]; // Take the largest reasonable amount
      }
    }
  }
  
  if (amountValue) {
    data.amount = amountValue;
  }
  
  // Extract UTR (look for alphanumeric patterns, typically 12 characters)
  const utrRegex = /\b([A-Z0-9]{10,20})\b/gi;
  const utrMatches = text.match(utrRegex);
  if (utrMatches && utrMatches.length > 0) {
    data.utr = utrMatches[0]; // Take the first match
  }
  
  // Extract date (look for DD/MM/YYYY or similar patterns)
  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    // Try to parse the date
    const dateStr = dateMatch[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      data.date = date;
    }
  }
  
  // Extract payer name (look for phrases like "from" or "paid by")
  const nameRegex = /(?:from|paid by|sender|received from)[:\s]*([A-Za-z\s]{3,50})/i;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    data.payerName = nameMatch[1].trim();
  }
  
  return data;
}

/**
 * Match extracted data with existing clients
 * @param {Object} extractedData - Data extracted from OCR
 * @returns {Object|null} Matched client or null
 */
async function matchClient(extractedData) {
  try {
    // If we have a UTR, try to match with existing payments
    if (extractedData.utr) {
      const existingPayment = await Payment.findOne({ utr: extractedData.utr })
        .populate('clientId');
      
      if (existingPayment && existingPayment.clientId) {
        return existingPayment.clientId;
      }
    }
    
    // If we have an amount, try to match with recent unpaid sales
    if (extractedData.amount) {
      // Find clients with sales that match this amount and are unpaid
      const clients = await Client.find();
      
      for (const client of clients) {
        // Find unpaid sales for this client
        // This is a simplified matching algorithm - in a real implementation,
        // you would have more sophisticated matching logic
        if (Math.abs(client.ratePerTray - extractedData.amount) < 100) {
          return client;
        }
      }
    }
    
    // If we have a payer name, try to match with existing clients
    if (extractedData.payerName) {
      const client = await Client.findOne({
        name: { $regex: extractedData.payerName, $options: 'i' }
      });
      
      if (client) {
        return client;
      }
    }
    
    // No match found
    return null;
  } catch (error) {
    console.error('Error matching client:', error);
    return null;
  }
}

/**
 * Confirm a payment by creating a payment record from a screenshot
 * @param {String} screenshotId - ID of the screenshot upload
 * @param {Object} paymentData - Payment data to create
 */
async function confirmPayment(screenshotId, paymentData) {
  try {
    const screenshot = await ScreenshotUpload.findById(screenshotId);
    if (!screenshot) {
      throw new Error('Screenshot not found');
    }
    
    // Create payment record
    const payment = new Payment({
      saleId: paymentData.saleId,
      clientId: paymentData.clientId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod || 'upi',
      utr: screenshot.extractedData.utr,
      date: paymentData.date || new Date(),
      screenshot: screenshot.filename,
      confirmed: true
    });
    
    const savedPayment = await payment.save();
    
    // Update screenshot status
    screenshot.status = 'confirmed';
    screenshot.paymentId = savedPayment._id;
    await screenshot.save();
    
    return savedPayment;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}

module.exports = {
  processScreenshot,
  confirmPayment
};