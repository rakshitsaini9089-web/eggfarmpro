// UPI Reader Controller
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { AIEngine } = require('../utils/aiEngine');
const Payment = require('../models/Payment');

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
 * Extract UPI payment information from screenshot
 */
async function extractUPIInfo(imagePath) {
  const aiEngine = new AIEngine();
  
  // In a real implementation, you would use OCR (like Tesseract) to extract text from the image
  // For now, we'll simulate this with AI analysis
  
  const prompt = `
  Analyze this UPI payment screenshot and extract the following information:
  1. Transaction amount
  2. Sender's UPI ID
  3. Date and time of transaction
  
  Respond in JSON format:
  {
    "amount": number,
    "senderUpiId": "string",
    "dateTime": "ISO datetime string"
  }
  `;
  
  try {
    const result = await aiEngine.generateJSON(prompt);
    return result;
  } catch (error) {
    console.error('Error extracting UPI info:', error);
    throw new Error('Failed to extract UPI information');
  }
}

/**
 * POST /ai/upi-reader
 * Upload UPI screenshot and auto-update client ledger
 */
async function upiReader(req, res) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract UPI information from screenshot
    const upiInfo = await extractUPIInfo(req.file.path);
    
    // Validate extracted information
    if (!upiInfo.amount || !upiInfo.senderUpiId || !upiInfo.dateTime) {
      return res.status(400).json({ 
        error: 'Could not extract complete UPI information from screenshot' 
      });
    }

    // TODO: Find client by UPI ID and update their ledger
    // This would require a mapping between UPI IDs and clients in your system
    
    // For demonstration, we'll create a payment record
    const payment = new Payment({
      clientId: null, // Would be populated after finding the client
      amount: upiInfo.amount,
      date: new Date(upiInfo.dateTime),
      paymentMethod: 'UPI',
      upiTransactionId: upiInfo.senderUpiId,
      notes: 'Auto-generated from UPI screenshot'
    });
    
    await payment.save();
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      message: 'UPI information extracted and payment recorded',
      data: {
        amount: upiInfo.amount,
        senderUpiId: upiInfo.senderUpiId,
        dateTime: upiInfo.dateTime,
        paymentId: payment._id
      }
    });
  } catch (error) {
    console.error('UPI Reader Error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to process UPI screenshot',
      details: error.message
    });
  }
}

module.exports = {
  upiReader,
  upiReaderUpload: upload.single('screenshot')
};