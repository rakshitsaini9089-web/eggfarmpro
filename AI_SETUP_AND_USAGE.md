# AI Features Setup and Usage Guide

This document provides comprehensive instructions for setting up and using the AI features in your Egg Farm Management System.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setting Up API Keys](#setting-up-api-keys)
3. [Configuration Options](#configuration-options)
4. [Testing Your Setup](#testing-your-setup)
5. [Using AI Features](#using-ai-features)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the AI features, ensure you have:

1. **Node.js v18+** installed on your system
2. **npm or yarn** package manager
3. **Modern web browser** (Chrome, Edge, Firefox recommended)
4. **Access to at least one AI service provider**

## Setting Up API Keys

### Step 1: Locate the Environment File
We've created a template environment file for you at:
```
/frontend/.env.local
```

### Step 2: Choose Your AI Provider
You have three options for AI providers:

#### Option A: OpenAI (Recommended - Paid)
- **Pros**: Best quality responses, fastest processing
- **Cons**: Requires payment after free credits expire
- **Setup**: Visit [OpenAI Platform](https://platform.openai.com/) to get your API key

#### Option B: HuggingFace (Free Alternative)
- **Pros**: Completely free to use
- **Cons**: May be slower than OpenAI
- **Setup**: Visit [HuggingFace](https://huggingface.co/settings/tokens) to get your API key

#### Option C: Ollama (Local/Offline)
- **Pros**: Completely private, no internet required
- **Cons**: Requires local installation and hardware resources
- **Setup**: Visit [Ollama AI](https://ollama.ai/) to download and install

### Step 3: Configure Your .env.local File
Edit the `.env.local` file with your actual API keys:

```env
# OpenAI API Key (Primary - Recommended for best quality)
OPENAI_API_KEY=sk-proj-your_actual_openai_key_here

# HuggingFace API Key (Free Alternative)
HUGGINGFACE_API_KEY=hf_your_actual_huggingface_key_here

# Application Settings
NEXT_PUBLIC_APP_NAME=Egg Farm Management System
NEXT_PUBLIC_APP_VERSION=1.0.0

# AI Feature Toggle
AI_FEATURES_ENABLED=true

# Model Configuration
DEFAULT_AI_MODEL=gpt-4o-mini
```

If you're only using one provider, leave the others blank:
```env
# Using only HuggingFace (example)
OPENAI_API_KEY=
HUGGINGFACE_API_KEY=hf_your_actual_huggingface_key_here
```

### Step 4: Enable AI Features
Ensure the AI features are enabled:
```env
AI_FEATURES_ENABLED=true
```

### Step 5: Restart Your Development Server
After making changes to your `.env.local` file, restart your development server:
```bash
# Stop the server (Ctrl+C if it's running)
# Then start it again
npm run dev
```

## Configuration Options

### Multi-Model Fallback System
Our AI engine automatically uses the best available model with this fallback order:
1. **OpenAI gpt-4o-mini** - Primary choice for quality and speed
2. **HuggingFace models** - Free alternative when OpenAI is unavailable
3. **Ollama local models** - Fully offline option for privacy

The system automatically detects which models are available and selects the best one.

### Customizing the Fallback Order
You can modify the fallback order in `backend/src/utils/aiEngine.js`:
```javascript
this.fallbackModels = [
  'HF_MODEL', // HuggingFace fallback
  'OLLAMA_MODEL' // Ollama local fallback
];
```

## Testing Your Setup

### Using the Built-in Test Page
We've created a test page to verify your configuration:
1. Visit: http://localhost:3001/ai/test
2. The page will show the status of your environment variables
3. It will indicate which AI providers are configured

### Manual Testing
1. Visit the AI Dashboard: http://localhost:3001/ai/dashboard
2. Try clicking the floating AI button in the bottom-right corner
3. Test a simple query like "Hello, what can you help me with?"

## Using AI Features

### 1. EggMind AI Smart Assistant
- **Location**: Floating button on every page (bottom-right corner)
- **Features**: 
  - Text chat with message history
  - Voice input capability
  - Database integration for contextual responses
- **Usage**: Click the floating button and start chatting

### 2. Screenshot-based UPI Payment Auto Reader
- **Location**: AI Dashboard → UPI Payment Reader card
- **Features**:
  - Upload UPI transaction screenshots
  - Automated payment data extraction
  - Client ledger integration
- **Usage**: 
  1. Navigate to AI Dashboard
  2. Click on "UPI Payment Reader" card
  3. Upload a UPI screenshot
  4. Click "Process Image"
  5. Review extracted details
  6. Click "Save to Client Ledger"

### 3. Expense Auto Entry via AI
- **Location**: AI Dashboard → Smart Expense Entry card
- **Features**:
  - Voice command processing
  - Category-based dropdowns
  - Smart form filling
- **Usage**:
  1. Navigate to AI Dashboard
  2. Click on "Smart Expense Entry" card
  3. Toggle voice mode on/off
  4. Speak or type expense details
  5. Review auto-filled form
  6. Submit expense entry

### 4. AI Daily Insight Generator
- **Location**: AI Dashboard → AI Insights card
- **Features**:
  - Automated daily summaries
  - Performance metrics analysis
  - Recommendation engine
- **Usage**: 
  - View daily insights in the AI Dashboard
  - Ask EggMind AI for specific insights

### 5. AI Profit Calculator
- **Location**: Through EggMind AI
- **Features**:
  - Period-based calculations (daily/weekly/monthly)
  - Comprehensive financial analysis
- **Usage**: 
  - Ask EggMind AI: "Calculate monthly profit for ARNB farm"

### 6. Multi-farm Smart Analytics
- **Location**: Through EggMind AI
- **Features**:
  - Farm performance comparison
  - Efficiency analysis
- **Usage**: 
  - Ask EggMind AI: "Compare ARNB and NR farms"

### 7. Auto Report Generator (PDF)
- **Location**: AI Dashboard → AI-Powered Reports card
- **Features**:
  - Multiple report types (daily/weekly/monthly)
  - Beautiful PDF templates
- **Usage**:
  1. Navigate to AI Dashboard
  2. Click on "AI-Powered Reports" card
  3. Select report type
  4. Click "Generate"
  5. Download or share the PDF report

### 8. AI Feed Optimization
- **Location**: Through EggMind AI
- **Features**:
  - Cost-effective formula calculation
  - Nutritional balance preservation
- **Usage**: 
  - Ask EggMind AI: "Optimize feed formula for ARNB farm"

### 9. AI Disease/Issue Suggestions
- **Location**: Through EggMind AI
- **Features**:
  - Symptom analysis
  - Diagnostic assistance
  - Treatment recommendations
- **Usage**: 
  - Tell EggMind AI: "Egg production dropped today at ARNB farm"

### 10. General "Talk to EggMind AI"
- **Location**: Floating AI button (bottom-right corner)
- **Features**:
  - Comprehensive task execution
  - Database interaction
  - Action automation
- **Usage**: 
  - Click the floating button and describe what you want to do

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure you've named the file `.env.local` (not `.env.local.txt`)
   - Restart your development server after making changes
   - Check that there are no spaces around the `=` sign

2. **API Key Errors**
   - Verify your API keys are correct and active
   - Check that you have sufficient credits/balance
   - Ensure your keys have the necessary permissions

3. **Voice Recognition Not Working**
   - Voice recognition only works in secure contexts (HTTPS or localhost)
   - Supported browsers: Chrome, Edge, Safari
   - Ensure your browser has microphone permissions

4. **HuggingFace Token Issues**
   - Make sure you created a "Write" token, not a "Read" token
   - Verify the token hasn't expired

5. **Ollama Not Detected**
   - Ensure Ollama is running (`ollama serve`)
   - Check that the model was pulled successfully (`ollama list`)
   - Verify the service is running on port 11434

6. **Model Fallback Issues**
   - Verify that Ollama is running if using local models
   - Check internet connectivity for cloud-based models
   - Ensure firewall settings allow API access

### Debugging Tips

1. **Check the Browser Console**
   - Press F12 to open Developer Tools
   - Look for JavaScript errors in the Console tab

2. **Monitor Network Requests**
   - In Developer Tools, go to the Network tab
   - Look for failed API requests

3. **Verify Environment Variables**
   - Use the test page at http://localhost:3001/ai/test
   - Or temporarily add debug code to a page:
   ```javascript
   console.log('OpenAI Key Present:', !!process.env.OPENAI_API_KEY);
   console.log('HuggingFace Key Present:', !!process.env.HUGGINGFACE_API_KEY);
   console.log('AI Features Enabled:', process.env.AI_FEATURES_ENABLED);
   ```

4. **Test API Endpoints Directly**
   - Use tools like Postman to test API endpoints
   - Check the backend console for error messages

### Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - The `.env.local` file is already in `.gitignore`
   - Regularly rotate your keys

2. **Data Privacy**
   - Be aware of what data is sent to AI providers
   - Consider using local models for sensitive information
   - Implement proper authentication and authorization

3. **Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Monitor API usage to detect anomalies
   - Set up alerts for unusual activity

## Support Resources

1. **Documentation**
   - Main README: `/ai/README.md`
   - Installation Guide: `INSTALLATION_AI.md`
   - API Keys Setup: `SETUP_API_KEYS.md`

2. **Web Interfaces**
   - AI Dashboard: http://localhost:3001/ai/dashboard
   - Setup Guide: http://localhost:3001/ai/setup
   - Configuration Test: http://localhost:3001/ai/test

3. **Code Structure**
   - Backend Controllers: `backend/src/controllers/`
   - Frontend Components: `frontend/src/components/`
   - API Routes: `frontend/src/app/api/ai/`

By following this guide, you should have a fully functional AI-powered egg farm management system. The modular design allows for easy expansion and customization based on your specific needs.