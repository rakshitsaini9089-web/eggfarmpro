const express = require('express');
const router = express.Router();
const { 
  sendTestMessage,
  sendInvoice,
  sendPaymentReminder,
  handleWebhook,
  getTemplates
} = require('../controllers/whatsappController');

// Send a test message
router.post('/send-test', sendTestMessage);

// Send an invoice
router.post('/send-invoice', sendInvoice);

// Send a payment reminder
router.post('/send-reminder', sendPaymentReminder);

// Handle incoming webhooks
router.post('/webhook', handleWebhook);

// Get available templates
router.get('/templates', getTemplates);

module.exports = router;