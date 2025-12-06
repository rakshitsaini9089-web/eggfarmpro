'use client';

import { useState, useEffect } from 'react';
import { whatsappAPI } from '../../lib/api';

interface WhatsAppTemplate {
  name: string;
  description: string;
}

export default function WhatsAppPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [invoiceData, setInvoiceData] = useState({
    clientName: '',
    invoiceNumber: '',
    total: '',
    dueDate: ''
  });
  const [reminderData, setReminderData] = useState({
    clientName: '',
    amount: '',
    purchaseDate: ''
  });
  const [activeTab, setActiveTab] = useState('test');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await whatsappAPI.getTemplates();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSendTestMessage = async () => {
    if (!phoneNumber || !message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await whatsappAPI.sendTestMessage({
        to: phoneNumber,
        message: message
      });
      alert('Test message sent successfully!');
    } catch (error) {
      console.error('Failed to send test message:', error);
      alert('Failed to send test message');
    }
  };

  const handleSendInvoice = async () => {
    if (!phoneNumber || !invoiceData.clientName || !invoiceData.invoiceNumber || 
        !invoiceData.total || !invoiceData.dueDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await whatsappAPI.sendInvoice({
        to: phoneNumber,
        invoiceData: {
          clientName: invoiceData.clientName,
          invoiceNumber: invoiceData.invoiceNumber,
          total: parseFloat(invoiceData.total),
          dueDate: invoiceData.dueDate,
          farmName: 'FarmSoft',
          subtotal: parseFloat(invoiceData.total),
          tax: 0,
          items: [{ name: 'Eggs', quantity: 1, total: parseFloat(invoiceData.total) }],
          contactInfo: 'contact@farmsoft.com'
        }
      });
      alert('Invoice sent successfully!');
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    }
  };

  const handleSendReminder = async () => {
    if (!phoneNumber || !reminderData.clientName || !reminderData.amount || 
        !reminderData.purchaseDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await whatsappAPI.sendPaymentReminder({
        to: phoneNumber,
        reminderData: {
          clientName: reminderData.clientName,
          amount: parseFloat(reminderData.amount),
          purchaseDate: reminderData.purchaseDate,
          farmName: 'FarmSoft'
        }
      });
      alert('Payment reminder sent successfully!');
    } catch (error) {
      console.error('Failed to send payment reminder:', error);
      alert('Failed to send payment reminder');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-800">WhatsApp Integration</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Available Templates</h2>
        
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div 
                key={template.name} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No templates available.</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('test')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Test Message
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'invoice'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Send Invoice
            </button>
            <button
              onClick={() => setActiveTab('reminder')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'reminder'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Payment Reminder
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'test' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Send Test Message</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="whatsapp-phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="whatsapp-phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number with country code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="whatsapp-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  ></textarea>
                </div>
                
                <button
                  onClick={handleSendTestMessage}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                >
                  Send Test Message
                </button>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Send Invoice</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="whatsapp-invoice-phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="whatsapp-invoice-phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number with country code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-invoice-clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    id="whatsapp-invoice-clientName"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({...invoiceData, clientName: e.target.value})}
                    placeholder="Enter client name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-invoice-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="whatsapp-invoice-number"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                    placeholder="Enter invoice number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-invoice-total" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="whatsapp-invoice-total"
                    value={invoiceData.total}
                    onChange={(e) => setInvoiceData({...invoiceData, total: e.target.value})}
                    placeholder="Enter total amount"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-invoice-dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="whatsapp-invoice-dueDate"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <button
                  onClick={handleSendInvoice}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                >
                  Send Invoice
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reminder' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Send Payment Reminder</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="whatsapp-reminder-phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="whatsapp-reminder-phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number with country code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-reminder-clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    id="whatsapp-reminder-clientName"
                    value={reminderData.clientName}
                    onChange={(e) => setReminderData({...reminderData, clientName: e.target.value})}
                    placeholder="Enter client name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-reminder-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="whatsapp-reminder-amount"
                    value={reminderData.amount}
                    onChange={(e) => setReminderData({...reminderData, amount: e.target.value})}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp-reminder-purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    id="whatsapp-reminder-purchaseDate"
                    value={reminderData.purchaseDate}
                    onChange={(e) => setReminderData({...reminderData, purchaseDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <button
                  onClick={handleSendReminder}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                >
                  Send Payment Reminder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Integration Status</h2>
        <p className="text-yellow-700 dark:text-yellow-300">
          WhatsApp integration is currently in scaffold mode. To enable full functionality:
        </p>
        <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
          <li>Obtain WhatsApp Business API credentials</li>
          <li>Configure environment variables in the backend</li>
          <li>Set up webhook endpoints for incoming messages</li>
          <li>Verify your business phone number with WhatsApp</li>
        </ul>
      </div>
    </div>
  );
}