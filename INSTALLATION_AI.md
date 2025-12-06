# AI Features Installation Guide

This guide provides step-by-step instructions for installing and configuring all AI features in the Egg Farm Management System.

## Prerequisites

Before installing the AI features, ensure you have:

1. Node.js v18+ installed
2. npm or yarn package manager
3. A modern web browser (Chrome, Edge, Firefox recommended)
4. Access to one or more AI service providers

## Installation Steps

### 1. Install Dependencies

Navigate to your project root directory and install all required packages:

```bash
npm install
```

Or if using yarn:

```bash
yarn install
```

### 2. Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```env
# OpenAI API Key (primary AI provider)
OPENAI_API_KEY=your_openai_api_key_here

# HuggingFace API Key (fallback provider)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional: Database connection if using custom backend
DATABASE_URL=your_database_connection_string

# Application settings
NEXT_PUBLIC_APP_NAME=Egg Farm Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. AI Provider Setup

#### OpenAI (Recommended)
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new secret key
5. Copy the key and add it to your `.env.local` file

#### HuggingFace (Free Alternative)
1. Visit [HuggingFace](https://huggingface.co/)
2. Sign up or log in to your account
3. Navigate to Access Tokens section in your profile settings
4. Create a new token
5. Copy the token and add it to your `.env.local` file

#### Ollama (Local/Offline Option)
1. Visit [Ollama AI](https://ollama.ai/)
2. Download and install Ollama for your operating system
3. Pull a model for local use:
   ```bash
   ollama pull llama3
   ```
4. Start the Ollama service:
   ```bash
   ollama serve
   ```

### 4. Backend Integration

The AI features require backend integration with your existing system. The following components have been created:

- **AI Engine**: Multi-model fallback system in `backend/src/utils/aiEngine.js`
- **Authentication Middleware**: Security layer in `backend/src/middleware/aiAuth.js`
- **Controllers**: Individual feature controllers in `backend/src/controllers/`
- **Routes**: API endpoints in `backend/src/routes/aiRoutes.js`

Ensure these files are properly integrated into your backend structure.

### 5. Frontend Component Integration

The following UI components are ready for use:

- `<AiChatWidget />` - Floating EggMind AI assistant button
- `<AiPanel />` - Chat interface with voice input
- `<UploadReader />` - UPI screenshot processor
- `<SmartExpenseForm />` - AI-powered expense entry
- `<AIReportCard />` - Report generation interface

Import and use these components in your pages:

```jsx
import { AiChatWidget, UploadReader, SmartExpenseForm, AIReportCard } from '@/components';
```

### 6. API Routes

The following API routes are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | AI chat conversations |
| `/api/ai/upi-reader` | POST | UPI screenshot processing |
| `/api/ai/expenses` | POST | Expense command parsing |
| `/api/ai/expenses` | GET | Expense categories |
| `/api/ai/report/[type]` | GET | Report generation |
| `/api/ai/daily-summary` | GET | Daily insights |
| `/api/ai/farm-compare` | GET | Farm comparison |
| `/api/ai/profit-calculator` | POST | Profit calculations |
| `/api/ai/disease-suggestion` | POST | Disease diagnostics |
| `/api/ai/feed-optimization` | POST | Feed formula optimization |

### 7. Testing the Installation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AI Dashboard:
   ```
   http://localhost:3001/ai/dashboard
   ```

3. Test each feature:
   - Click the floating AI button and try a conversation
   - Upload a UPI screenshot to test the reader
   - Use voice commands in the expense form
   - Generate a report from the report card

### 8. Troubleshooting

#### Common Issues

1. **API Key Errors**
   - Ensure your API keys are correctly set in `.env.local`
   - Verify that your keys have the necessary permissions
   - Check for typos or extra spaces in your keys

2. **Voice Recognition Not Working**
   - Voice recognition only works in secure contexts (HTTPS or localhost)
   - Supported browsers: Chrome, Edge, Safari
   - Ensure your browser has microphone permissions

3. **OCR Processing Failures**
   - Ensure Tesseract.js is properly installed
   - Check that uploaded images are in supported formats (PNG, JPG, JPEG)
   - Large images may take longer to process

4. **Model Fallback Issues**
   - Verify that Ollama is running if using local models
   - Check internet connectivity for cloud-based models
   - Ensure firewall settings allow API access

#### Debugging Tips

1. Check the browser console for JavaScript errors
2. Monitor network requests in developer tools
3. Verify environment variables are loaded correctly
4. Test API endpoints directly with tools like Postman

### 9. Customization

#### Modifying AI Prompts
All AI prompts are structured as JSON instructions. You can customize them in the backend controllers.

#### Adding New Features
To add new AI features:
1. Create a new controller in `backend/src/controllers/`
2. Add routes in `backend/src/routes/aiRoutes.js`
3. Create frontend components in `frontend/src/components/`
4. Add API routes in `frontend/src/app/api/ai/`

#### Changing Fallback Order
Modify the fallback order in `backend/src/utils/aiEngine.js`:
```javascript
this.fallbackModels = [
  'HF_MODEL', // HuggingFace fallback
  'OLLAMA_MODEL' // Ollama local fallback
];
```

### 10. Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform
2. Ensure HTTPS is enabled for voice features
3. Configure proper error handling and logging
4. Set up monitoring for API usage and costs
5. Implement rate limiting to prevent abuse

### 11. Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - Use environment variables for all secrets
   - Rotate keys regularly

2. **Data Privacy**
   - Be aware of what data is sent to AI providers
   - Consider using local models for sensitive information
   - Implement proper authentication and authorization

3. **Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Monitor API usage to detect anomalies
   - Set up alerts for unusual activity

### 12. Support

For issues with the AI features:

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are properly installed
4. Refer to the documentation in `/ai/README.md`
5. Contact support if issues persist

---

By following this guide, you should have a fully functional AI-powered egg farm management system. The modular design allows for easy expansion and customization based on your specific needs.