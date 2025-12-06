'use client';

import { useState } from 'react';
import { StyledForm, StyledInput, StyledTextarea, StyledSelect } from '../../components';

export default function StyledFormsDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    message: '',
    subscribe: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Form submitted:', formData);
    alert('Form submitted successfully!');
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Styled Forms Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This page demonstrates the new styled form components with enhanced visual design and improved save button visibility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Simple Form */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Simple Contact Form</h2>
          <StyledForm
            onSubmit={handleSubmit}
            onCancel={() => setFormData({
              name: '',
              email: '',
              phone: '',
              category: '',
              message: '',
              subscribe: false,
            })}
            title="Contact Information"
            description="Please provide your contact details"
            submitButtonText="Send Message"
            isSubmitting={isSubmitting}
          >
            <StyledInput
              label="Full Name"
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />

            <StyledInput
              label="Email Address"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              helperText="We'll never share your email with anyone else."
            />

            <StyledInput
              label="Phone Number"
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(123) 456-7890"
            />
          </StyledForm>
        </div>

        {/* Advanced Form */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Advanced Form</h2>
          <StyledForm
            onSubmit={handleSubmit}
            onCancel={() => setFormData({
              name: '',
              email: '',
              phone: '',
              category: '',
              message: '',
              subscribe: false,
            })}
            title="Support Request"
            description="Fill out this form to get help from our team"
            submitButtonText="Submit Request"
            isSubmitting={isSubmitting}
          >
            <StyledSelect
              label="Category"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="billing">Billing Issue</option>
              <option value="technical">Technical Support</option>
              <option value="account">Account Management</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </StyledSelect>

            <StyledTextarea
              label="Message"
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe your issue or request in detail..."
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="subscribe"
                name="subscribe"
                checked={formData.subscribe}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="subscribe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Subscribe to our newsletter
              </label>
            </div>
          </StyledForm>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enhanced Form Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">Improved Styling</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Modern design with better spacing, shadows, and visual hierarchy for a professional look.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">Clear Save Button</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Prominent save button with gradient styling, hover effects, and loading state indication.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">Validation Feedback</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Visual error indicators and helper text to guide users through form completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}