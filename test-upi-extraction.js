// Test script to verify UPI extraction improvements
const fs = require('fs');

// Sample PayTM screenshot text (simulated OCR output)
const samplePaytmText = `
Paytm Payments Bank
Transaction Successful
₹1,250.00
Paid to
john.doe@paytm
Txn Id: TXN1234567890
Updated balance: ₹4,500.75
`;

// Sample Google Pay screenshot text
const sampleGpayText = `
Google Pay
Payment of ₹2,500.50
to priya.sharma@oksbi
successful
Transaction ID: GPAY9876543210
`;

// Sample PhonePe screenshot text
const samplePhonePeText = `
PhonePe
₹1,800.00
Sent to
raj.kumar@ybl
Reference ID: PP1234567890
`;

// Test amount extraction patterns
console.log('Testing amount extraction patterns...\n');

// Enhanced amount regex
const enhancedAmountRegex = /(?:₹|rs\.?|inr)[\s]*([\d,]+\.\d{2})|([\d,]+\.\d{2})[\s]*(?:rs\.?|inr|rupees)|(?:paid|amount|total)[\s]*[₹:]?[\s]*([\d,]+\.\d{2})|[₹:]?[\s]*([\d,]+\.\d{2})[\s]*(?:paid|amount|total)/gi;

// Test with PayTM text
console.log('PayTM Text:');
console.log(samplePaytmText);
let match;
while ((match = enhancedAmountRegex.exec(samplePaytmText)) !== null) {
  console.log('Amount match:', match);
  // Extract the actual amount value
  const potentialAmount = match[0].replace(/[^\d.]/g, '');
  if (potentialAmount && potentialAmount.includes('.')) {
    const parsed = parseFloat(potentialAmount);
    if (!isNaN(parsed) && parsed > 0) {
      console.log('Extracted amount:', parsed);
      break;
    }
  }
}

console.log('\n---\n');

// Test UPI ID extraction patterns
console.log('Testing UPI ID extraction patterns...\n');

const comprehensiveUpiPatterns = [
  /(?:from|to|recipient|payer|sender|receiver)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,
  /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)[:\s\n\r]*(?:is\s*)?(?:verified|success|paid|approved|done|completed)/i,
  /(?:upi\s*(?:id)?|vpa)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,
  /(?:paid\s+to|received\s+from|sent\s+to|money\s+to)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,
  /[₹:]?[\s\n\r]*[\d,]+\.\d{2}[\s\n\r]+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,
  /(?:collect\s+request\s+from)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,
  /(?:account)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i
];

// Test with PayTM text
console.log('PayTM Text UPI ID extraction:');
for (const pattern of comprehensiveUpiPatterns) {
  const match = samplePaytmText.match(pattern);
  if (match) {
    const upiId = Array.isArray(match) ? match[1] || match[0] : match[1];
    if (upiId && upiId.includes('@') && upiId.length > 3 && upiId.length < 50) {
      console.log('UPI ID found:', upiId);
      break;
    }
  }
}

console.log('\n---\n');

// Test transaction ID extraction patterns
console.log('Testing transaction ID extraction patterns...\n');

const comprehensiveTxnPatterns = [
  /(?:transaction\s*(?:id)?|txn\s*(?:id)?|reference\s*(?:id)?|ref\s*(?:id)?|order\s*(?:id)?|payment\s*(?:id)?|utr)[:\s\n\r]*([A-Z0-9]{8,30})/i,
  /([A-Z0-9]{8,30})[\s\n\r]*(?:is\s*)?(?:successful|completed|done|approved|verified|processed)/i,
  /(?:upi\s*(?:ref)?|bank\s*ref)[:\s\n\r]*([A-Z0-9]{8,30})/i,
  /[₹:]?[\s\n\r]*[\d,]+\.\d{2}[\s\n\r]+([A-Z0-9]{8,30})/i,
  /(?:collect\s+request\s+(?:id)?|mandate\s+(?:id)?)[:\s\n\r]*([A-Z0-9]{8,30})/i
];

// Test with PayTM text
console.log('PayTM Text Transaction ID extraction:');
for (const pattern of comprehensiveTxnPatterns) {
  const match = samplePaytmText.match(pattern);
  if (match) {
    const potentialTxnId = Array.isArray(match) ? match[1] || match[0] : match[1];
    if (potentialTxnId && /^[A-Z0-9]{8,30}$/.test(potentialTxnId)) {
      console.log('Transaction ID found:', potentialTxnId);
      break;
    }
  }
}