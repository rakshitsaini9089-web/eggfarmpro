// Test script for AI-powered UPI Reader
const fs = require('fs');

// Sample UPI transaction texts for testing
const sampleTransactions = [
  // Google Pay transaction
  `Google Pay
Payment of ₹1,250.00
to rahul.sharma@oksbi
successful
Transaction ID: GPAY1234567890
Jan 05, 2025 2:22 PM`,

  // PhonePe transaction
  `PhonePe
₹2,500.50
Sent to
priya.jain@ybl
Reference ID: PP9876543210
01/05/2025 3:30 PM`,

  // Paytm transaction
  `Paytm Payments Bank
Transaction Successful
₹1,800.00
Paid to
amit.kumar@paytm
Txn Id: TXN1234567890
Updated balance: ₹4,500.75
05 Jan 2025 14:45`,

  // Multiple transactions in one text
  `Recent Transactions:
1. Google Pay: ₹1,250.00 received from rahul.sharma@oksbi (GPAY1234567890) on Jan 05, 2025 2:22 PM
2. PhonePe: ₹2,500.50 sent to priya.jain@ybl (PP9876543210) on 01/05/2025 3:30 PM
3. Paytm: ₹1,800.00 paid to amit.kumar@paytm (TXN1234567890) on 05 Jan 2025 14:45`,

  // OCR error examples
  `Google Pay
Payment of Rs.1,2OO.00 recd
to john.doe@okaxis
successful
Transaction ID: GPAY1O0O2O3O4O
Jan O5, 2OO5 2:22 PM`,

  // BHIM transaction
  `BHIM UPI
Credited Rs.3,400.00
From: supplier@upi
Ref: BHIM9876543210
05/01/2025 16:20`
];

console.log('=== AI-Powered UPI Reader Test Cases ===\n');

sampleTransactions.forEach((transaction, index) => {
  console.log(`Test Case ${index + 1}:`);
  console.log('Input Text:');
  console.log(transaction);
  console.log('\nExpected Output:');
  
  switch(index) {
    case 0:
      console.log('Single Google Pay transaction with amount 1250, receiver rahul.sharma@oksbi');
      break;
    case 1:
      console.log('Single PhonePe transaction with amount 2500.50, receiver priya.jain@ybl');
      break;
    case 2:
      console.log('Single Paytm transaction with amount 1800, receiver amit.kumar@paytm');
      break;
    case 3:
      console.log('Multiple transactions detected (Google Pay, PhonePe, Paytm)');
      break;
    case 4:
      console.log('OCR error correction: 1,2OO.00 -> 1200, GPAY1O0O2O3O4O -> GPAY1000203040');
      break;
    case 5:
      console.log('BHIM transaction with amount 3400, receiver supplier@upi');
      break;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
});

console.log('Run these test cases through the AI UPI Reader to verify functionality.');