// Test to simulate the actual API response format
const mockApiResponse = {
  success: true,
  amount: "1250.00",
  upi_id: "test@upi",
  txnid: "TXN1234567890",
  raw_text: "Processed successfully"
};

console.log('Mock API Response:');
console.log(JSON.stringify(mockApiResponse, null, 2));

// Simulate the UploadReader component's onUpload callback
function simulateOnUpload(data) {
  console.log('\n=== SIMULATING ONUPLOAD CALLBACK ===');
  console.log('Received data:', data);
  
  // Simulate the dashboard's amount parsing logic
  let parsedAmount = 0;
  
  if (data.amount || data.amount === 0) {
    console.log('\n=== PROCESSING AMOUNT ===');
    console.log('Raw amount data:', data.amount);
    console.log('Amount type:', typeof data.amount);
    
    if (typeof data.amount === 'string') {
      console.log('Processing string amount:', data.amount);
      
      // Cleaning approach
      let cleanAmount = data.amount.replace(/[^0-9.]/g, '');
      console.log('Cleaned amount:', cleanAmount);
      
      parsedAmount = parseFloat(cleanAmount);
      console.log('Parsed amount:', parsedAmount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.log('Parsing failed, trying alternatives');
        const numberMatch = data.amount.match(/\d+(?:\.\d+)?/);
        if (numberMatch) {
          parsedAmount = parseFloat(numberMatch[0]);
          console.log('Alternative parsing result:', parsedAmount);
        }
      }
    } else if (typeof data.amount === 'number') {
      parsedAmount = data.amount;
      console.log('Using numeric amount directly:', parsedAmount);
    }
    
    // Validation
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10000000) {
      console.log('Amount validation failed, resetting to 0');
      parsedAmount = 0;
    }
    
    console.log('FINAL PARSED AMOUNT:', parsedAmount);
  }
  
  // Simulate form data update
  const formData = {
    clientId: '',
    saleId: '',
    amount: 0,
    paymentMethod: 'cash',
    upi_id: '',
    utr: '',
    date: '2023-01-01',
    description: ''
  };
  
  console.log('\n=== FORM DATA UPDATE ===');
  console.log('Before update:', formData);
  
  const updatedFormData = {
    ...formData,
    amount: (parsedAmount && parsedAmount > 0) ? parsedAmount : formData.amount,
    upi_id: data.upi_id || formData.upi_id,
    utr: data.txnid || formData.utr
  };
  
  console.log('After update:', updatedFormData);
  
  // Verification
  console.log('\n=== VERIFICATION ===');
  console.log('Amount updated correctly:', updatedFormData.amount === 1250);
  console.log('UPI ID updated correctly:', updatedFormData.upi_id === 'test@upi');
  console.log('UTR updated correctly:', updatedFormData.utr === 'TXN1234567890');
  
  return updatedFormData;
}

// Execute the simulation
const result = simulateOnUpload(mockApiResponse);
console.log('\n=== FINAL RESULT ===');
console.log('Form successfully updated with UPI data');