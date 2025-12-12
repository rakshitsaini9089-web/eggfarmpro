// AI-Powered UPI Reader Controller
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Payment = require('../models/Payment');
const Tesseract = require('tesseract.js');
const { AIEngine } = require('../utils/aiEngine');

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
 * Extract UPI payment information from text using AI
 * @param {string} rawText - Raw text from OCR or manual input
 * @returns {Object|Array} - Parsed UPI transaction data
 */
async function extractUPIInfoWithAI(rawText) {
  try {
    console.log('Processing UPI text with AI:', rawText.substring(0, 200) + '...');
    
    // Initialize AI engine
    const aiEngine = new AIEngine();
    
    // Preprocess text to fix common OCR errors
    let processedText = rawText
      .replace(/1,O0O/g, '1000')
      .replace(/Credlted/g, 'Credited')
      .replace(/recd/g, 'received')
      .replace(/Credited/g, 'received')
      .replace(/Debited/g, 'paid')
      .replace(/Rs\.?\s*/gi, '₹')
      .replace(/INR\.?\s*/gi, '₹');
    
    // Create AI prompt for parsing UPI information
    const prompt = `
    You are an expert financial data extractor. Parse the following UPI payment text and extract all transaction details.
    
    Text to analyze:
    "${processedText}"
    
    Instructions:
    1. Identify all UPI transactions in the text
    2. For each transaction, extract:
       - Transaction type (received/paid/pending/refund)
       - Amount (as a number, remove commas, convert "1,O0O" to 1000, "Credlted" to "Credited", etc.)
       - Sender/Receiver name
       - UPI ID / VPA
       - Bank Name / App Source (GPay, PhonePe, Paytm, Bank, etc.)
       - Transaction ID
       - Date and Time
    3. Correct common OCR errors:
       - "1,O0O" → "1000"
       - "Credlted" → "Credited"
       - "Rs.1,2OO.00 recd" → "1200"
    4. Remove promotional text, noise, and greetings
    5. If multiple transactions exist, return an array
    6. Always return JSON format
    
    Return ONLY valid JSON in this exact format:
    {
      "transaction_type": "received",
      "amount": 850,
      "from": "Rahul",
      "upi_id": "rahul@okaxis",
      "ref_no": "4098324098234",
      "source": "Google Pay",
      "timestamp": "2025-01-05 14:22",
      "raw_text": "original user input"
    }
    
    Or if multiple transactions:
    [
      {
        "transaction_type": "received",
        "amount": 850,
        "from": "Rahul",
        "upi_id": "rahul@okaxis",
        "ref_no": "4098324098234",
        "source": "Google Pay",
        "timestamp": "2025-01-05 14:22",
        "raw_text": "original user input"
      },
      {
        "transaction_type": "received",
        "amount": 1200,
        "from": "Priya",
        "upi_id": "priya@ybl",
        "ref_no": "4098324098235",
        "source": "PhonePe",
        "timestamp": "2025-01-05 15:30",
        "raw_text": "original user input"
      }
    ]
    
    IMPORTANT: Return ONLY the JSON, no explanations or markdown.
    `;
    
    // Get AI response
    const aiResponse = await aiEngine.generateResponse(prompt);
    
    console.log('AI Response:', aiResponse);
    
    // Try to parse the AI response as JSON
    try {
      const parsedData = JSON.parse(aiResponse);
      return parsedData;
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', parseError);
      // Fallback to regex-based extraction if AI fails
      return extractUPIInfoWithRegex(rawText);
    }
  } catch (error) {
    console.error('AI UPI extraction error:', error);
    // Fallback to regex-based extraction if AI fails
    return extractUPIInfoWithRegex(rawText);
  }
}

/**
 * Fallback regex-based extraction for UPI information
 * @param {string} text - Text to extract UPI information from
 * @returns {Object|Array} - Parsed UPI transaction data
 */
function extractUPIInfoWithRegex(text) {
  console.log('Using regex fallback for UPI extraction');
  
  // Common corrections for OCR errors
  text = text.replace(/1,O0O/g, '1000');
  text = text.replace(/Credlted/g, 'Credited');
  text = text.replace(/recd/g, 'received');
  text = text.replace(/Credited/g, 'received');
  text = text.replace(/Debited/g, 'paid');
  text = text.replace(/Rs\.?\s*/gi, '₹');
  text = text.replace(/INR\.?\s*/gi, '₹');
  
  // Extract all potential transactions
  const transactions = [];
  
  // Split text into potential transaction blocks
  const blocks = text.split(/(?=transaction|payment|paid|received|debited|credited)/i);
  
  // Process each block
  for (const block of blocks) {
    if (block.trim().length < 10) continue; // Skip very short blocks
    
    // Extract potential amounts
    const amountMatches = block.match(/(?:₹|rs\.?|inr)[\s]*([\d,]+\.?\d*)|([\d,]+\.?\d*)[\s]*(?:rs\.?|inr|rupees)/gi);
    let amount = 0;
    
    if (amountMatches) {
      for (const match of amountMatches) {
        const cleanAmount = match.replace(/[^\d.]/g, '');
        const parsed = parseFloat(cleanAmount);
        if (!isNaN(parsed) && parsed > amount && parsed >= 10 && parsed <= 10000000) { // Reasonable range
          amount = parsed;
        }
      }
    }
    
    // Skip if no reasonable amount found
    if (amount === 0) continue;
    
    // Extract UPI IDs
    const upiIdMatches = block.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/g);
    const upiId = upiIdMatches ? upiIdMatches[0] : '';
    
    // Extract transaction IDs
    const txnIdMatches = block.match(/[A-Z0-9]{8,30}/g);
    const txnId = txnIdMatches ? txnIdMatches[0] : '';
    
    // Extract sender/receiver name
    let senderName = '';
    const namePatterns = [
      /(?:from|to|recipient|payer|sender|receiver)[:\s]*([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]+)(?=\s*(?:paid|received|credited|debited))/i
    ];
    
    for (const pattern of namePatterns) {
      const match = block.match(pattern);
      if (match) {
        senderName = match[1]?.trim() || '';
        break;
      }
    }
    
    // Determine transaction type
    let transactionType = 'received';
    if (block.toLowerCase().includes('paid') || block.toLowerCase().includes('sent') || block.toLowerCase().includes('debited')) {
      transactionType = 'paid';
    } else if (block.toLowerCase().includes('refund')) {
      transactionType = 'refund';
    } else if (block.toLowerCase().includes('pending')) {
      transactionType = 'pending';
    }
    
    // Try to extract timestamp
    let timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    
    // Extract source/app name
    let source = '';
    const sourcePatterns = [
      { pattern: /google\s*pay/i, name: 'Google Pay' },
      { pattern: /phone\s*pe/i, name: 'PhonePe' },
      { pattern: /paytm/i, name: 'Paytm' },
      { pattern: /bhim/i, name: 'BHIM' },
      { pattern: /amazon\s*pay/i, name: 'Amazon Pay' },
      { pattern: /whatsapp\s*pay/i, name: 'WhatsApp Pay' }
    ];
      
    for (const { pattern, name } of sourcePatterns) {
      if (pattern.test(block)) {
        source = name;
        break;
      }
    }
    
    // Add transaction to results
    transactions.push({
      transaction_type: transactionType,
      amount: amount,
      from: senderName,
      upi_id: upiId,
      ref_no: txnId,
      source: source,
      timestamp: timestamp,
      raw_text: block.trim()
    });
  }
  
  // Return single transaction or array based on count
  if (transactions.length === 0) {
    // Return default empty transaction if nothing found
    return {
      transaction_type: 'received',
      amount: 0,
      from: '',
      upi_id: '',
      ref_no: '',
      source: '',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      raw_text: text
    };
  } else if (transactions.length === 1) {
    return transactions[0];
  } else {
    return transactions;
  }
}

/**
 * Process UPI screenshot using OCR and AI
 */
async function processUPIScreenshot(imagePath) {
  try {
    console.log('Processing UPI screenshot:', imagePath);
    
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
    
    console.log('OCR Result:', result.data.text.substring(0, 200) + '...');
    
    // Extract UPI information using AI
    const upiInfo = await extractUPIInfoWithAI(result.data.text);
    
    return upiInfo;
  } catch (error) {
    console.error('UPI Screenshot processing error:', error);
    throw error;
  }
}

/**
 * POST /api/upi/process-text
 * Process manually pasted UPI text
 */
async function processUPIText(req, res) {
  try {
    const { text, userId } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required' 
      });
    }
    
    console.log('Processing UPI text input');
    
    // Extract UPI information using AI
    const upiInfo = await extractUPIInfoWithAI(text);
    
    // Prepare response
    const response = {
      success: true,
      data: upiInfo,
      message: 'UPI information extracted successfully'
    };
    
    return res.json(response);
  } catch (error) {
    console.error('UPI Text Processing Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process UPI text',
      details: error.message
    });
  }
}

/**
 * POST /api/upi/process-file
 * Process uploaded SMS text file
 */
async function processUPISMSFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'File is required' 
      });
    }
    
    console.log('Processing UPI SMS file:', req.file.path);
    
    // Read file content
    const fileContent = await fs.readFile(req.file.path, 'utf8');
    
    // Extract UPI information using AI
    const upiInfo = await extractUPIInfoWithAI(fileContent);
    
    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
      console.log('SMS file cleaned up');
    } catch (unlinkError) {
      console.warn('Could not delete SMS file:', unlinkError.message);
    }
    
    // Prepare response
    const response = {
      success: true,
      data: upiInfo,
      message: 'UPI information extracted successfully'
    };
    
    return res.json(response);
  } catch (error) {
    console.error('UPI SMS File Processing Error:', error);
    
    // Clean up uploaded file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up SMS file:', unlinkError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to process UPI SMS file',
      details: error.message
    });
  }
}

/**
 * POST /api/upi/process-screenshot
 * Process uploaded UPI screenshot
 */
async function processUPIScreenshotEndpoint(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Screenshot is required' 
      });
    }
    
    console.log('Processing UPI screenshot:', req.file.path);
    
    // Process screenshot with OCR and AI
    const upiInfo = await processUPIScreenshot(req.file.path);
    
    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
      console.log('Screenshot file cleaned up');
    } catch (unlinkError) {
      console.warn('Could not delete screenshot file:', unlinkError.message);
    }
    
    // Prepare response
    const response = {
      success: true,
      data: upiInfo,
      message: 'UPI information extracted successfully'
    };
    
    return res.json(response);
  } catch (error) {
    console.error('UPI Screenshot Processing Error:', error);
    
    // Clean up uploaded file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up screenshot file:', unlinkError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to process UPI screenshot',
      details: error.message
    });
  }
}

/**
 * POST /api/upi/save-transaction
 * Save parsed UPI transaction to database
 */
async function saveUPITransaction(req, res) {
  try {
    const { transaction, userId, rawText } = req.body;
    
    if (!transaction) {
      return res.status(400).json({ 
        error: 'Transaction data is required' 
      });
    }
    
    console.log('Saving UPI transaction:', transaction);
    
    // Check for duplicates based on amount + timestamp + ref_no
    const duplicateQuery = {
      amount: transaction.amount,
      upiTransactionId: transaction.ref_no
    };
    
    // Add date range check (within 1 day)
    const transactionDate = new Date(transaction.timestamp);
    const startDate = new Date(transactionDate);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(transactionDate);
    endDate.setDate(endDate.getDate() + 1);
    
    duplicateQuery.date = { $gte: startDate, $lte: endDate };
    
    const existingPayment = await Payment.findOne(duplicateQuery);
    
    if (existingPayment) {
      // Return existing payment with duplicate flag
      const response = {
        success: true,
        paymentId: existingPayment._id,
        duplicate: true,
        message: 'Duplicate transaction detected'
      };
      
      return res.json(response);
    }
    
    // Create payment record
    const payment = new Payment({
      clientId: null, // Will be linked later
      amount: transaction.amount,
      date: new Date(transaction.timestamp),
      paymentMethod: 'UPI',
      upiTransactionId: transaction.ref_no,
      notes: `Auto-generated from UPI ${transaction.source || 'reader'} - ${rawText?.substring(0, 50)}`
    });
    
    const savedPayment = await payment.save();
    console.log('Payment saved:', savedPayment._id);
    
    // Prepare response
    const response = {
      success: true,
      paymentId: savedPayment._id,
      duplicate: false,
      message: 'UPI transaction saved successfully'
    };
    
    return res.json(response);
  } catch (error) {
    console.error('UPI Transaction Save Error:', error);
    return res.status(500).json({ 
      error: 'Failed to save UPI transaction',
      details: error.message
    });
  }
}

module.exports = {
  processUPIText,
  processUPISMSFile,
  processUPIScreenshotEndpoint,
  saveUPITransaction,
  upiTextUpload: upload.none(),
  upiFileUpload: upload.single('file'),
  upiScreenshotUpload: upload.single('screenshot')
};