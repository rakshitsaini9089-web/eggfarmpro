# API Keys Setup Guide

This guide will walk you through setting up API keys for the AI features in your Egg Farm Management System.

## Step 1: Locate the Environment File

We've created a template environment file for you at:
```
/frontend/.env.local
```

## Step 2: Choose Your AI Provider

You have three options for AI providers. You can set up one, two, or all three:

### Option A: OpenAI (Recommended - Paid)
**Pros**: Best quality responses, fastest processing
**Cons**: Requires payment after free credits expire

### Option B: HuggingFace (Free Alternative)
**Pros**: Completely free to use
**Cons**: May be slower than OpenAI

### Option C: Ollama (Local/Offline)
**Pros**: Completely private, no internet required
**Cons**: Requires local installation and hardware resources

## Step 3: Set Up Your Chosen Provider(s)

### Setting Up OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up for an account or log in if you already have one
3. Navigate to the API Keys section (https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Give your key a name (e.g., "Egg Farm Management")
6. Copy the generated key
7. Paste it into your `.env.local` file:
   ```
   OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### Setting Up HuggingFace
1. Visit [HuggingFace](https://huggingface.co/)
2. Sign up for an account or log in if you already have one
3. Go to your profile settings
4. Navigate to the "Access Tokens" section
5. Click "New token"
6. Give your token a name (e.g., "Egg Farm Management")
7. Set role to "Write" (recommended for full functionality)
8. Copy the generated token
9. Paste it into your `.env.local` file:
   ```
   HUGGINGFACE_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### Setting Up Ollama (Local)
1. Visit [Ollama AI](https://ollama.ai/)
2. Download the installer for your operating system
3. Install Ollama following the installation instructions
4. Open a terminal/command prompt
5. Pull a model for local use:
   ```bash
   ollama pull llama3
   ```
6. Start the Ollama service:
   ```bash
   ollama serve
   ```
7. No API key needed - the system will automatically detect Ollama

## Step 4: Configure Your .env.local File

Edit the `.env.local` file and replace the placeholder values with your actual API keys:

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

If you're only using one provider, you can leave the others blank:
```env
# Using only HuggingFace (example)
OPENAI_API_KEY=
HUGGINGFACE_API_KEY=hf_your_actual_huggingface_key_here
```

## Step 5: Enable AI Features

Ensure the AI features are enabled in your `.env.local` file:
```env
AI_FEATURES_ENABLED=true
```

## Step 6: Restart Your Development Server

After making changes to your `.env.local` file, restart your development server:

```bash
# Stop the server (Ctrl+C if it's running)
# Then start it again
npm run dev
```

## Step 7: Test Your Configuration

1. Visit the AI Dashboard: http://localhost:3001/ai/dashboard
2. Try clicking the floating AI button in the bottom-right corner
3. Test a simple query like "Hello, what can you help me with?"

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

3. **HuggingFace Token Issues**
   - Make sure you created a "Write" token, not a "Read" token
   - Verify the token hasn't expired

4. **Ollama Not Detected**
   - Ensure Ollama is running (`ollama serve`)
   - Check that the model was pulled successfully (`ollama list`)
   - Verify the service is running on port 11434

### Checking Your Setup

You can verify your environment variables are loaded correctly by adding this temporary code to a page:

```javascript
// Temporary debug code - remove after verification
console.log('OpenAI Key Present:', !!process.env.OPENAI_API_KEY);
console.log('HuggingFace Key Present:', !!process.env.HUGGINGFACE_API_KEY);
console.log('AI Features Enabled:', process.env.AI_FEATURES_ENABLED);
```

## Security Best Practices

1. **Never commit API keys to version control**
   - The `.env.local` file is already in `.gitignore`
   - Double-check that you haven't accidentally committed keys

2. **Regularly rotate your keys**
   - Generate new keys every 3-6 months
   - Update your `.env.local` file with new keys

3. **Monitor usage**
   - Check your provider dashboards for unusual activity
   - Set up billing alerts to avoid unexpected charges

## Need Help?

If you encounter any issues:

1. Check the browser console for error messages
2. Look at the terminal where your development server is running
3. Verify all your API keys are correctly formatted
4. Ensure you have internet connectivity (unless using Ollama only)
5. Refer to the detailed documentation in `/ai/README.md`

For additional support, contact the development team with:
- Screenshots of error messages
- Your `.env.local` configuration (with keys redacted)
- Steps to reproduce the issue