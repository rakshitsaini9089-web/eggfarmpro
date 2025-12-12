// Simple test to verify our regex patterns work
const text = `
Paytm Payments Bank
Transaction Successful
₹1,250.00
Paid to
john.doe@paytm
Txn Id: TXN1234567890
Updated balance: ₹4,500.75
`;

console.log('Testing with text:');
console.log(text);

// Test amount extraction
const amountRegex = /(?:₹|rs\.?|inr)[\s]*([\d,]+\.\d{2})|([\d,]+\.\d{2})[\s]*(?:rs\.?|inr|rupees)|(?:paid|amount|total)[\s]*[₹:]?[\s]*([\d,]+\.\d{2})|[₹:]?[\s]*([\d,]+\.\d{2})[\s]*(?:paid|amount|total)/gi;

let match;
while ((match = amountRegex.exec(text)) !== null) {
    console.log('Amount match found:', match[0]);
    // Extract numeric value
    const cleanAmount = match[0].replace(/[^\d.]/g, '');
    const parsedAmount = parseFloat(cleanAmount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
        console.log('Parsed amount:', parsedAmount);
        break;
    }
}

// Test UPI ID extraction
const upiPattern = /(?:paid\s+to|received\s+from|sent\s+to)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i;
const upiMatch = text.match(upiPattern);
if (upiMatch) {
    console.log('UPI ID found:', upiMatch[1]);
}

// Test transaction ID extraction
const txnPattern = /(?:txn\s+id|transaction\s+id|reference\s+id|ref\s+id)[:\s\n\r]*([A-Z0-9]{8,30})/i;
const txnMatch = text.match(txnPattern);
if (txnMatch) {
    console.log('Transaction ID found:', txnMatch[1]);
}