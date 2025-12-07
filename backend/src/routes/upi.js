const express = require("express");
const multer = require("multer");
const fs = require("fs");
const tesseract = require("tesseract.js");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/scan", upload.single("file"), async (req, res) => {
  console.log('UPI Scan route called');
  console.log('Headers:', req.headers);
  console.log('Authorization header:', req.headers.authorization);
  console.log('File:', req.file);
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    console.log('Processing OCR for file:', req.file.path);
    const result = await tesseract.recognize(req.file.path, "eng");
    
    console.log('OCR completed successfully');

    const text = result.data.text;
    console.log('OCR text:', text);

    const upiMatches = text.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z]+/g);
    const amountMatches = text.match(/₹\s?(\d+(\.\d+)?)/g);

    const upi_id = upiMatches ? upiMatches[0] : null;
    const amount = amountMatches ? amountMatches[0].replace("₹", "").trim() : null;
    const txnid = null; // Transaction ID extraction not implemented in this version

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
      console.log('File cleaned up successfully');
    } catch (unlinkError) {
      console.error('Error cleaning up file:', unlinkError);
    }

    const response = {
      success: true,
      upi_id,
      amount,
      txnid,
      raw_text: text,
    };
    
    console.log('Sending response:', response);
    return res.json(response);
  } catch (err) {
    console.error('OCR processing error:', err);
    
    // Clean up uploaded file if exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('File cleaned up after error');
      } catch (unlinkError) {
        console.error('Error cleaning up file after error:', unlinkError);
      }
    }
    
    return res.status(500).json({ success: false, message: "OCR failed", error: err.message });
  }
});

module.exports = router;