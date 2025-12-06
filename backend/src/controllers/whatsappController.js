const WhatsAppService = require('../services/whatsappService');

const whatsappService = new WhatsAppService();

/**
 * Send a test WhatsApp message
 */
async function sendTestMessage(req, res) {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ 
        message: 'Missing required fields: to, message' 
      });
    }
    
    const result = await whatsappService.sendTextMessage(to, message);
    
    res.json({
      message: 'Test message sent successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to send test message',
      error: err.message 
    });
  }
}

/**
 * Send an invoice via WhatsApp
 */
async function sendInvoice(req, res) {
  try {
    const { to, invoiceData } = req.body;
    
    if (!to || !invoiceData) {
      return res.status(400).json({ 
        message: 'Missing required fields: to, invoiceData' 
      });
    }
    
    const result = await whatsappService.sendInvoice(to, invoiceData);
    
    res.json({
      message: 'Invoice sent successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to send invoice',
      error: err.message 
    });
  }
}

/**
 * Send a payment reminder via WhatsApp
 */
async function sendPaymentReminder(req, res) {
  try {
    const { to, reminderData } = req.body;
    
    if (!to || !reminderData) {
      return res.status(400).json({ 
        message: 'Missing required fields: to, reminderData' 
      });
    }
    
    const result = await whatsappService.sendPaymentReminder(to, reminderData);
    
    res.json({
      message: 'Payment reminder sent successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to send payment reminder',
      error: err.message 
    });
  }
}

/**
 * Handle incoming WhatsApp webhooks
 */
async function handleWebhook(req, res) {
  try {
    // Validate webhook signature (in production)
    // const signature = req.headers['x-hub-signature-256'];
    // if (!whatsappService.validateWebhookSignature(signature, req.body)) {
    //   return res.status(401).json({ message: 'Invalid webhook signature' });
    // }
    
    const payload = req.body;
    const result = await whatsappService.processWebhook(payload);
    
    res.json({
      message: 'Webhook processed successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to process webhook',
      error: err.message 
    });
  }
}

/**
 * Get available WhatsApp templates
 */
function getTemplates(req, res) {
  try {
    // In a real implementation, you might fetch templates from WhatsApp
    // For now, we'll return our local templates
    
    const templates = [
      { name: 'payment_reminder', description: 'Payment reminder template' },
      { name: 'invoice', description: 'Invoice template' },
      { name: 'delivery_notification', description: 'Delivery notification template' },
      { name: 'order_confirmation', description: 'Order confirmation template' },
      { name: 'vaccination_reminder', description: 'Vaccination reminder template' },
      { name: 'mortality_alert', description: 'Mortality alert template' }
    ];
    
    res.json({
      message: 'Available templates retrieved successfully',
      templates
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to retrieve templates',
      error: err.message 
    });
  }
}

module.exports = {
  sendTestMessage,
  sendInvoice,
  sendPaymentReminder,
  handleWebhook,
  getTemplates
};