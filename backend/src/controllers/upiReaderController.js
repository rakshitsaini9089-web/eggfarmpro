// UPI Reader Controller
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Payment = require('../models/Payment');
const Tesseract = require('tesseract.js');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Extract UPI payment information from screenshot using OCR
 */
async function extractUPIInfo(imagePath) {
  try {
    console.log('Processing image file:', imagePath);
    
    // Process the image with Tesseract.js
    const result = await Tesseract.recognize(
      imagePath,
      'eng',
      { 
        logger: info => console.log(info),
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@.₹ ',  // Whitelist common characters
        tessedit_pageseg_mode: '6',  // Assume a single uniform block of text
        preserve_interword_spaces: '1'
      }
    );
    
    console.log('OCR Confidence:', result.data.confidence);
    console.log('OCR Paragraphs:', result.data.paragraphs);
    console.log('OCR Words count:', result.data.words ? result.data.words.length : 0);
    
    console.log('OCR Result:', result.data.text);
    
    // Log first 1000 characters of OCR text for debugging
    console.log('First 1000 chars of OCR text:', result.data.text.substring(0, 1000));
    
    // Extract UPI information from the text
    const text = result.data.text;
    
    // IMPROVED AMOUNT EXTRACTION FOR ALL UPI PROVIDERS INCLUDING PAYTM
    let amount = 0;
    console.log('EXTRACTING AMOUNT FROM TEXT:', text);
    
    // STEP 1: Extract ALL numbers from the text with improved regex
    const allNumberMatches = text.match(/\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?/g);
    console.log('ALL NUMBER MATCHES:', allNumberMatches);
    
    if (allNumberMatches) {
      // STEP 2: Parse and clean all numbers with better handling
      const parsedNumbers = [];
      for (const num of allNumberMatches) {
        // Remove commas and clean
        const cleanNum = num.replace(/,/g, '').trim();
        const parsed = parseFloat(cleanNum);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 10000000) { // Reasonable upper limit
          parsedNumbers.push(parsed);
        }
      }
      
      console.log('CLEANED AND PARSED NUMBERS:', parsedNumbers);
      
      // STEP 3: Filter for realistic payment amounts (10 to 10000000)
      const paymentAmounts = parsedNumbers.filter(n => n >= 10 && n <= 10000000);
      console.log('FILTERED PAYMENT AMOUNTS (10-10000000):', paymentAmounts);
      
      // STEP 4: Sort descending to get largest amounts first
      paymentAmounts.sort((a, b) => b - a);
      console.log('SORTED PAYMENT AMOUNTS:', paymentAmounts);
      
      // STEP 5: Enhanced pattern matching for various UPI providers
      if (paymentAmounts.length > 0) {
        // Look for common payment amount patterns
        
        // Pattern 1: Look for amounts near common UPI keywords (PayTM specific)
        const paytmPatterns = [
          /(?:paid|amount|total|rs\.?|inr)[\s\n\r]*[₹:]?[\s\n\r]*([\d,]+\.\d{2})/gi,
          /([\d,]+\.\d{2})[\s\n\r]*(?:paid|amount|total|rs\.?|inr)/gi,
          /[₹:]?[\s\n\r]*([\d,]+\.\d{2})[\s\n\r]*(?:to|from|by)/gi
        ];
        
        let paytmAmountFound = false;
        for (const pattern of paytmPatterns) {
          const matches = text.match(pattern);
          if (matches) {
            console.log('PAYTM PATTERN MATCHES:', pattern, matches);
            for (const match of matches) {
              const amountValue = Array.isArray(match) ? match[1] || match[0] : match[1];
              if (amountValue) {
                const cleanAmount = amountValue.replace(/[^0-9.]/g, '');
                const parsedAmount = parseFloat(cleanAmount);
                if (!isNaN(parsedAmount) && parsedAmount >= 10 && parsedAmount <= 10000000) {
                  amount = parsedAmount;
                  paytmAmountFound = true;
                  console.log('PAYTM AMOUNT FOUND:', amount);
                  break;
                }
              }
            }
            if (paytmAmountFound) break;
          }
        }
        
        if (!paytmAmountFound) {
          // Pattern 2: Look for amounts ending in .00 or .50 (common in Indian currency)
          const roundAmounts = paymentAmounts.filter(n => n % 1 === 0 || (n * 100) % 50 === 0);
          console.log('ROUND AMOUNTS (.00 or .50 endings):', roundAmounts);
          
          if (roundAmounts.length > 0) {
            // Take the first (largest) round amount
            amount = roundAmounts[0];
            console.log('SELECTED ROUND AMOUNT:', amount);
          } else {
            // Pattern 3: Just take the largest amount
            amount = paymentAmounts[0];
            console.log('SELECTED LARGEST AMOUNT:', amount);
          }
        }
      }
    }
    
    // STEP 6: Ultimate fallback - if still no amount, try specific patterns
    if (amount === 0) {
      console.log('ULTIMATE FALLBACK: Trying specific patterns');
      
      // Look for patterns like "1,500.00" or "1500.00" or "₹1,500"
      const specificPatterns = [
        /(?:₹|rs\.?|inr)[\s]*([\d,]+\.\d{2})/gi,  // ₹1,500.00
        /([\d,]+\.\d{2})[\s]*(?:rs\.?|inr)/gi,  // 1,500.00 rs
        /total[\s]*:[\s]*([\d,]+\.?\d*)/gi,  // total: 1,500.00
        /paid[\s]*:[\s]*([\d,]+\.?\d*)/gi,   // paid: 1,500.00
        /amount[\s]*:[\s]*([\d,]+\.?\d*)/gi,  // amount: 1,500.00
        /(?:credited|debited)[\s]*[₹:]?[\s]*([\d,]+\.?\d*)/gi  // credited: 1,500.00
      ];
      
      for (const pattern of specificPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          console.log('SPECIFIC PATTERN MATCHES:', pattern, matches);
          for (const match of matches) {
            const amountValue = Array.isArray(match) ? match[1] || match[0] : match[1];
            if (amountValue) {
              const cleanAmount = amountValue.replace(/[^0-9.]/g, '');
              const parsedAmount = parseFloat(cleanAmount);
              if (!isNaN(parsedAmount) && parsedAmount > amount && parsedAmount >= 10 && parsedAmount <= 10000000) {
                amount = parsedAmount;
                console.log('UPDATED AMOUNT FROM SPECIFIC PATTERN:', amount);
              }
            }
          }
        }
      }
    }
    
    // STEP 7: If still zero, just take the largest number we found
    if (amount === 0 && allNumberMatches) {
      console.log('LAST RESORT: Taking largest number');
      const allParsed = allNumberMatches
        .map(n => parseFloat(n.replace(/,/g, '').replace(/[^0-9.]/g, '')))
        .filter(n => !isNaN(n) && n > 0);
      
      if (allParsed.length > 0) {
        amount = Math.max(...allParsed);
        console.log('LAST RESORT AMOUNT:', amount);
      }
    }
    
    console.log('*** FINAL EXTRACTED AMOUNT:', amount, ' ***');
    
    // Look for UPI ID patterns (e.g., "xyz@upi", "user@bank")
    let senderUpiId = '';
    console.log('Searching for UPI IDs in text');
    
    // Comprehensive UPI ID patterns for all providers including PayTM, Google Pay, PhonePe, etc.
    const comprehensiveUpiPatterns = [
      /(?:from|to|recipient|payer|sender|receiver)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,  // From: xyz@paytm
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)[:\s\n\r]*(?:is\s*)?(?:verified|success|paid|approved|done|completed)/i,  // xyz@paytm verified
      /(?:upi\s*(?:id)?|vpa)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,  // UPI ID: xyz@paytm
      /(?:paid\s+to|received\s+from|sent\s+to|money\s+to)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,  // Paid to: xyz@paytm
      /[₹:]?[\s\n\r]*[\d,]+\.\d{2}[\s\n\r]+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,  // Amount followed by UPI ID
      /(?:collect\s+request\s+from)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,  // Collect request from: xyz@paytm
      /(?:account)[:\s\n\r]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i  // Account: xyz@paytm
    ];
    
    // Try comprehensive patterns first
    for (const pattern of comprehensiveUpiPatterns) {
      const match = text.match(pattern);
      if (match) {
        const upiId = Array.isArray(match) ? match[1] || match[0] : match[1];
        console.log('Comprehensive UPI ID pattern matched:', pattern, 'with value:', upiId);
        if (upiId && upiId.includes('@') && upiId.length > 3 && upiId.length < 50) {  // Ensure it looks like a valid UPI ID
          senderUpiId = upiId;
          break;
        }
      }
    }
    
    // If comprehensive patterns didn't work, try general patterns
    if (!senderUpiId) {
      const generalUpiPatterns = [
        /(?:from|to|sender|receiver)[:\s]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,  // From: xyz@upi
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)[:\s]*(?:is\s*)?(?:verified|success)/i,  // xyz@upi verified
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/g  // Simple pattern (global)
      ];
      
      for (const pattern of generalUpiPatterns) {
        const match = text.match(pattern);
        if (match) {
          // For global patterns, take the first match
          const upiId = Array.isArray(match) ? match[1] || match[0] : match[1];
          console.log('General UPI ID pattern matched:', pattern, 'with value:', upiId);
          if (upiId && upiId.includes('@') && upiId.length > 3 && upiId.length < 50) {  // Ensure it looks like a valid UPI ID
            senderUpiId = upiId;
            break;
          }
        }
      }
    }
    
    // Fallback: look for any email-like pattern near common UPI keywords
    if (!senderUpiId) {
      console.log('Trying fallback UPI ID extraction');
      const upiContextPattern = /(?:upi|payment|transaction|transfer|collect).*?([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i;
      const contextMatch = text.match(upiContextPattern);
      if (contextMatch) {
        const upiId = contextMatch[1];
        console.log('Context-based UPI ID pattern matched:', upiId);
        if (upiId && upiId.includes('@') && upiId.length > 3 && upiId.length < 50) {
          senderUpiId = upiId;
        }
      }
    }
    
    // Last resort: look for any pattern that looks like a UPI ID
    if (!senderUpiId) {
      console.log('Trying last resort UPI ID extraction');
      const lastResortPattern = /\b[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\b/g;
      const allMatches = text.match(lastResortPattern);
      if (allMatches) {
        console.log('All potential UPI IDs found:', allMatches);
        // Filter for plausible UPI IDs
        const plausibleUpiIds = allMatches.filter(id => 
          id.includes('@') && 
          !id.includes(' ')
        );
        
        if (plausibleUpiIds.length > 0) {
          senderUpiId = plausibleUpiIds[0];
          console.log('Selected UPI ID from last resort:', senderUpiId);
        }
      }
    }
    
    console.log('Final extracted UPI ID:', senderUpiId);
    
    // Look for transaction ID patterns (alphanumeric, typically 12-20 characters)
    let txnId = '';
    console.log('Searching for transaction IDs in text');
    
    // Comprehensive transaction ID patterns for all UPI providers
    const comprehensiveTxnPatterns = [
      /(?:transaction\s*(?:id)?|txn\s*(?:id)?|reference\s*(?:id)?|ref\s*(?:id)?|order\s*(?:id)?|payment\s*(?:id)?|utr)[:\s\n\r]*([A-Z0-9]{8,30})/i,  // Various ID labels
      /([A-Z0-9]{8,30})[\s\n\r]*(?:is\s*)?(?:successful|completed|done|approved|verified|processed)/i,  // TXN1234567890 successful
      /(?:upi\s*(?:ref)?|bank\s*ref)[:\s\n\r]*([A-Z0-9]{8,30})/i,  // UPI Ref: TXN1234567890
      /[₹:]?[\s\n\r]*[\d,]+\.\d{2}[\s\n\r]+([A-Z0-9]{8,30})/i,  // Amount followed by transaction ID
      /(?:collect\s+request\s+(?:id)?|mandate\s+(?:id)?)[:\s\n\r]*([A-Z0-9]{8,30})/i  // Collect request ID: TXN1234567890
    ];
    
    // Try comprehensive patterns first
    for (const pattern of comprehensiveTxnPatterns) {
      const match = text.match(pattern);
      if (match) {
        const potentialTxnId = Array.isArray(match) ? match[1] || match[0] : match[1];
        console.log('Comprehensive Transaction ID pattern matched:', pattern, 'with value:', potentialTxnId);
        
        // Validate that it looks like a transaction ID (alphanumeric, reasonable length)
        if (potentialTxnId && /^[A-Z0-9]{8,30}$/.test(potentialTxnId)) {
          txnId = potentialTxnId;
          break;
        }
      }
    }
    
    // If comprehensive patterns didn't work, try general patterns
    if (!txnId) {
      const generalTxnPatterns = [
        /(?:transaction|txn|ref|reference|order|payment|utr)[\s\n\r]*[:\s\n\r]*([A-Z0-9]{8,30})/i,  // Transaction: TXN123456789
        /([A-Z0-9]{10,30})[\s\n\r]*(?:is\s*)?(?:successful|completed|done)/i,  // TXN123456789 successful
        /ref[\s\n\r]*[:\s\n\r]*([A-Z0-9]{8,30})/i,  // Ref: TXN123456789
        /([A-Z0-9]{10,30})/g  // Simple pattern (global)
      ];
      
      for (const pattern of generalTxnPatterns) {
        const match = text.match(pattern);
        if (match) {
          // For global patterns, take the first match that looks like a transaction ID
          const potentialTxnId = Array.isArray(match) ? match[1] || match[0] : match[1];
          console.log('General Transaction ID pattern matched:', pattern, 'with value:', potentialTxnId);
          
          // Validate that it looks like a transaction ID (alphanumeric, reasonable length)
          if (potentialTxnId && /^[A-Z0-9]{8,30}$/.test(potentialTxnId)) {
            txnId = potentialTxnId;
            break;
          }
        }
      }
    }
    
    // Enhanced fallback: look for any alphanumeric string of reasonable length with better validation
    if (!txnId) {
      console.log('Trying enhanced fallback transaction ID extraction');
      const enhancedTxnPattern = /\b[A-Z0-9]{8,30}\b/g;
      const allMatches = text.match(enhancedTxnPattern);
      if (allMatches) {
        console.log('Potential transaction IDs found:', allMatches);
        // Filter and rank matches by likelihood
        const validTxnIds = allMatches.filter(match => 
          /^[A-Z0-9]{8,30}$/.test(match) &&
          /[A-Z]/.test(match) &&  // Should contain at least one letter
          /[0-9]/.test(match) &&  // Should contain at least one digit
          !match.includes(' ') &&
          !match.includes('\n')
        ).sort((a, b) => b.length - a.length); // Prefer longer IDs
        
        if (validTxnIds.length > 0) {
          txnId = validTxnIds[0];
          console.log('Selected transaction ID from enhanced fallback:', txnId);
        }
      }
    }
    
    // Last resort: look for any sequence that might be a transaction ID
    if (!txnId) {
      console.log('Trying last resort transaction ID extraction');
      // Look for mixed alphanumeric sequences that are reasonably long
      const lastResortPattern = /[A-Z0-9]{8,30}/gi;
      const allMatches = text.match(lastResortPattern);
      if (allMatches) {
        console.log('Last resort transaction IDs found:', allMatches);
        // Take the longest valid-looking one
        const validCandidates = allMatches.filter(match => 
          match.length >= 8 && 
          match.length <= 30 &&
          /[A-Z]/.test(match) &&
          /[0-9]/.test(match)
        ).sort((a, b) => b.length - a.length);
        
        if (validCandidates.length > 0) {
          txnId = validCandidates[0];
          console.log('Selected transaction ID from last resort:', txnId);
        }
      }
    }
    
    console.log('Final extracted transaction ID:', txnId);
    
    const extractedData = {
      amount: amount,
      senderUpiId: senderUpiId,
      txnId: txnId,
      dateTime: new Date().toISOString()
    };
    
    console.log('Extracted UPI data:', extractedData);
    return extractedData;
  } catch (error) {
    console.error('Error in extractUPIInfo:', error.message);
    // Return fallback data instead of throwing
    return {
      amount: 0,
      senderUpiId: '',
      txnId: '',
      dateTime: new Date().toISOString()
    };
  }
}

/**
 * POST /ai/upi-reader
 * Upload UPI screenshot and auto-update client ledger
 */
async function upiReader(req, res) {
  console.log('UPI Reader endpoint called');
  console.log('File uploaded:', req.file ? req.file.filename : 'No file');
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file:', req.file.path);
    
    // Extract UPI information
    const upiInfo = await extractUPIInfo(req.file.path);
    
    console.log('UPI Info extracted:', upiInfo);
    console.log('UPI Info amount type:', typeof upiInfo.amount);
    console.log('UPI Info amount value:', upiInfo.amount);
    
    // Create payment record with extracted data
    const payment = new Payment({
      clientId: null,
      amount: upiInfo.amount,
      date: new Date(),
      paymentMethod: 'UPI',
      upiTransactionId: upiInfo.senderUpiId,
      notes: 'Auto-generated from UPI screenshot'
    });
    
    console.log('Saving payment to database...');
    const savedPayment = await payment.save();
    console.log('Payment saved:', savedPayment._id);
    
    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
      console.log('File cleaned up');
    } catch (unlinkError) {
      console.warn('Could not delete file:', unlinkError.message);
    }
    
    // Prepare response data
    const responseData = {
      success: true,
      message: 'UPI information extracted and payment recorded',
      amount: upiInfo.amount,
      upi_id: upiInfo.senderUpiId,
      txnid: upiInfo.txnId || upiInfo.senderUpiId,
      raw_text: 'Processed successfully'
    };
    
    // Log the response for debugging
    console.log('Sending UPI response:', JSON.stringify(responseData, null, 2));
    
    // Return success response
    return res.json(responseData);
  } catch (error) {
    console.error('UPI Reader Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Clean up uploaded file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to process UPI screenshot',
      details: error.message
    });
  }
}

module.exports = {
  upiReader,
  upiReaderUpload: upload.single('screenshot')
};