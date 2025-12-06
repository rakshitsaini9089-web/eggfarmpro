const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ScreenshotUpload = require('../models/ScreenshotUpload');
const { processScreenshot, confirmPayment } = require('../utils/ocrService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload screenshot
router.post('/upload', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Generate file hash for duplicate detection
    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // Check for duplicates
    const existingScreenshot = await ScreenshotUpload.findOne({ hash });
    if (existingScreenshot) {
      return res.status(400).json({ 
        message: 'Duplicate screenshot detected',
        existing: existingScreenshot
      });
    }

    // Save upload record
    const screenshotUpload = new ScreenshotUpload({
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      hash: hash,
      status: 'uploaded'
    });

    const savedScreenshot = await screenshotUpload.save();

    // Process OCR in background
    processScreenshot(savedScreenshot._id)
      .then(() => {
        console.log(`OCR processing completed for ${savedScreenshot.filename}`);
      })
      .catch((err) => {
        console.error(`OCR processing failed for ${savedScreenshot.filename}:`, err);
      });

    res.status(201).json(savedScreenshot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all screenshots
router.get('/', async (req, res) => {
  try {
    const screenshots = await ScreenshotUpload.find().sort({ createdAt: -1 });
    res.json(screenshots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get screenshot by ID
router.get('/:id', async (req, res) => {
  try {
    const screenshot = await ScreenshotUpload.findById(req.params.id);
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }
    
    res.json(screenshot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update screenshot (confirm match)
router.put('/:id/confirm', async (req, res) => {
  try {
    const screenshot = await ScreenshotUpload.findByIdAndUpdate(
      req.params.id,
      {
        matchedClientId: req.body.matchedClientId,
        paymentId: req.body.paymentId,
        status: 'confirmed'
      },
      { new: true }
    );

    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }

    res.json(screenshot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Confirm payment from screenshot
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const payment = await confirmPayment(req.params.id, req.body);
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete screenshot
router.delete('/:id', async (req, res) => {
  try {
    const screenshot = await ScreenshotUpload.findByIdAndDelete(req.params.id);
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(screenshot.path)) {
      fs.unlinkSync(screenshot.path);
    }

    res.json({ message: 'Screenshot deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;