// WhatsApp message templates
const whatsappTemplates = {
  // Payment reminder template
  paymentReminder: {
    name: 'payment_reminder',
    template: `Hello {{clientName}},
    
This is a friendly reminder that you have an outstanding payment of ₹{{amount}} for your egg purchase on {{purchaseDate}}.
    
Please make the payment at your earliest convenience. You can pay via:
- UPI: {{upiId}}
- Bank Transfer: {{bankDetails}}
    
Thank you for your business!
    
Best regards,
{{farmName}}`,
    variables: ['clientName', 'amount', 'purchaseDate', 'upiId', 'bankDetails', 'farmName']
  },
  
  // Invoice template
  invoice: {
    name: 'invoice',
    template: `--- {{farmName}} ---
INVOICE
    
Customer: {{clientName}}
Date: {{invoiceDate}}
Invoice #: {{invoiceNumber}}
    
Items:
{{items}}
    
Subtotal: ₹{{subtotal}}
Tax: ₹{{tax}}
Total: ₹{{total}}
    
Payment Due: {{dueDate}}
    
Thank you for your business!
    
Contact: {{contactInfo}}`,
    variables: ['farmName', 'clientName', 'invoiceDate', 'invoiceNumber', 'items', 'subtotal', 'tax', 'total', 'dueDate', 'contactInfo']
  },
  
  // Delivery notification template
  deliveryNotification: {
    name: 'delivery_notification',
    template: `Hello {{clientName}},
    
Your egg order of {{quantity}} trays has been delivered successfully on {{deliveryDate}}.
    
Delivery Details:
- Time: {{deliveryTime}}
- Driver: {{driverName}}
- Vehicle: {{vehicleNumber}}
    
We hope you're satisfied with our service. Please let us know if you have any feedback.
    
Best regards,
{{farmName}}`,
    variables: ['clientName', 'quantity', 'deliveryDate', 'deliveryTime', 'driverName', 'vehicleNumber', 'farmName']
  },
  
  // Order confirmation template
  orderConfirmation: {
    name: 'order_confirmation',
    template: `Hello {{clientName}},
    
Thank you for your order! Here are the details:
    
Order #: {{orderNumber}}
Date: {{orderDate}}
Items: {{items}}
Total: ₹{{total}}
    
Expected Delivery: {{deliveryDate}}
    
Our team will contact you before delivery.
    
Best regards,
{{farmName}}`,
    variables: ['clientName', 'orderNumber', 'orderDate', 'items', 'total', 'deliveryDate', 'farmName']
  },
  
  // Vaccination reminder template
  vaccinationReminder: {
    name: 'vaccination_reminder',
    template: `Attention {{farmName}} Team,
    
Reminder: Vaccination for batch "{{batchName}}" is scheduled for {{vaccinationDate}}.
    
Details:
- Vaccine: {{vaccineName}}
- Quantity Required: {{quantity}}
- Batch Size: {{batchSize}} birds
    
Please ensure all preparations are completed on time.
    
Automated Reminder System`,
    variables: ['farmName', 'batchName', 'vaccinationDate', 'vaccineName', 'quantity', 'batchSize']
  },
  
  // Mortality alert template
  mortalityAlert: {
    name: 'mortality_alert',
    template: `ALERT: High Mortality Detected
    
Farm: {{farmName}}
Batch: {{batchName}}
Date: {{alertDate}}
    
Mortality Count: {{count}} birds
Mortality Rate: {{rate}}%
Threshold: {{threshold}}%
    
Immediate action recommended.
    
Automated Alert System`,
    variables: ['farmName', 'batchName', 'alertDate', 'count', 'rate', 'threshold']
  }
};

module.exports = whatsappTemplates;