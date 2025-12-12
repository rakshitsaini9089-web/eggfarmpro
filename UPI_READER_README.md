# AI-Powered UPI Reader Module

## Overview

The AI-Powered UPI Reader Module is a comprehensive solution for extracting financial data from UPI transactions using advanced AI techniques. This module can process three types of inputs:

1. **Manual text paste** - Users can paste UPI transaction text directly
2. **Uploaded SMS text file** - Process bulk SMS transaction data
3. **Uploaded screenshots** - Use OCR to extract text from UPI payment screenshots

## Features

### AI Text Extraction
- Intelligent parsing of UPI transaction data
- Error correction for common OCR mistakes:
  - "1,O0O" → "1000"
  - "Credlted" → "Credited"
  - "Rs.1,2OO.00 recd" → "1200"
- Automatic detection of:
  - Transaction type (received/paid/pending/refund)
  - Amount (with comma and formatting handling)
  - Sender/Receiver name
  - UPI ID / VPA
  - Bank Name / App Source (GPay, PhonePe, Paytm, Bank)
  - Transaction ID
  - Date and Time
- Removal of promotional text, noise, and greetings

### AI Output Structure
The AI always returns structured JSON data:

```json
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
```

For multiple transactions:
```json
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
```

### UI/UX Features
- Clean modern green theme matching the existing application
- Three-tab interface for different input methods
- Animated loading indicators
- Success/error notifications
- Manual editing capabilities for AI-extracted data
- Responsive design for mobile devices

### OCR Integration
- Processes low-quality screenshots
- Uses Tesseract.js for text extraction
- Handles various UPI app formats (GPay, PhonePe, Paytm, etc.)

### Multiple Transaction Detection
- Identifies multiple transactions in a single input
- Processes each transaction separately
- Returns array of transactions when multiple are detected

### Deduplication Logic
- Checks for duplicate transactions before saving
- Uses amount + timestamp + reference number for matching
- Prevents duplicate entries in the database

### Dashboard Integration
- Automatically updates dashboard metrics after saving transactions
- Updates totals for received payments, pending amounts, etc.

### Error Handling
- Graceful error handling with user-friendly messages
- Manual correction interface for uncertain AI extractions
- Validation of all input data

## Technical Implementation

### Backend Components
1. **AI UPI Reader Controller** (`backend/src/controllers/aiUpiReaderController.js`)
   - AI-powered text parsing using multiple fallback strategies
   - OCR integration with Tesseract.js
   - Deduplication logic
   - Data validation and sanitization

2. **AI UPI Routes** (`backend/src/routes/aiUpiRoutes.js`)
   - RESTful API endpoints for all UPI reader functionality
   - Authentication middleware integration

3. **Enhanced AI Engine** (`backend/src/utils/aiEngine.js`)
   - Multi-model AI support (OpenAI, Groq, HuggingFace, Ollama)
   - Fallback mechanisms for reliability

### Frontend Components
1. **UPI Reader Page** (`frontend/src/app/ocr/page.tsx`)
   - Three-tab interface for different input methods
   - Real-time processing feedback
   - Transaction display and editing
   - Dashboard integration

2. **Navigation Integration** (`frontend/src/components/Sidebar.tsx`)
   - Added "UPI Reader" link to main navigation

### API Endpoints
- `POST /api/ai-upi/process-text` - Process manually pasted text
- `POST /api/ai-upi/process-file` - Process uploaded SMS text file
- `POST /api/ai-upi/process-screenshot` - Process uploaded screenshot
- `POST /api/ai-upi/save-transaction` - Save extracted transaction

## Usage Instructions

1. Navigate to the UPI Reader section from the main menu
2. Select the appropriate tab for your input method:
   - **Paste Text**: Copy and paste UPI transaction text
   - **Upload SMS File**: Upload a text file containing SMS transactions
   - **Upload Screenshot**: Upload a UPI payment screenshot
3. Click "Process with AI" to extract transaction data
4. Review the extracted data and make any necessary corrections
5. Click "Save to Records" to store the transaction in the database
6. The dashboard will automatically update with the new transaction data

## Testing

The module includes comprehensive test cases for various scenarios:
- Different UPI apps (GPay, PhonePe, Paytm, BHIM)
- Multiple transactions in a single input
- OCR error correction
- Edge cases and malformed data

See `test-ai-upi.js` for sample test cases.

## Future Enhancements

- Integration with client linking for automatic payment association
- Enhanced AI models for better accuracy
- Support for additional languages
- Batch processing capabilities
- Export functionality for extracted transactions