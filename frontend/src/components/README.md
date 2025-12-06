# Styled Form Components

This directory contains enhanced form components designed to improve the user experience and visual appeal of forms throughout the Egg Farm Management System.

## Components

### StyledForm
A wrapper component for forms that provides consistent styling, a header section, and prominent action buttons.

#### Props
- `children`: React nodes to be rendered inside the form
- `onSubmit`: Function to handle form submission
- `onCancel` (optional): Function to handle cancel action
- `submitButtonText` (optional): Text for the submit button (defaults to "Save")
- `cancelButtonText` (optional): Text for the cancel button (defaults to "Cancel")
- `title` (optional): Form title displayed in the header
- `description` (optional): Form description displayed in the header
- `isSubmitting` (optional): Boolean indicating if form is submitting (shows loading state)

### StyledInput
An enhanced input component with built-in label, error handling, and helper text support.

#### Props
- `label` (optional): Input label text
- `error` (optional): Error message to display
- `helperText` (optional): Helper text to display below the input
- `required` (optional): Indicates if the field is required
- All standard HTML input attributes

### StyledTextarea
An enhanced textarea component with built-in label, error handling, and helper text support.

#### Props
- `label` (optional): Textarea label text
- `error` (optional): Error message to display
- `helperText` (optional): Helper text to display below the textarea
- `required` (optional): Indicates if the field is required
- All standard HTML textarea attributes

### StyledSelect
An enhanced select component with built-in label, error handling, and helper text support.

#### Props
- `label` (optional): Select label text
- `error` (optional): Error message to display
- `helperText` (optional): Helper text to display below the select
- `required` (optional): Indicates if the field is required
- All standard HTML select attributes

## Usage Example

```jsx
import { StyledForm, StyledInput, StyledTextarea, StyledSelect } from '@/components';

export default function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <StyledForm
      onSubmit={handleSubmit}
      onCancel={() => console.log('Cancel clicked')}
      title="Contact Us"
      description="Please fill out this form to get in touch with us"
      submitButtonText="Send Message"
    >
      <StyledInput
        label="Full Name"
        type="text"
        id="name"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <StyledInput
        label="Email Address"
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
        helperText="We'll never share your email with anyone else."
      />
      
      <StyledSelect
        label="Category"
        id="category"
        name="category"
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
        required
      >
        <option value="">Select a category</option>
        <option value="support">Support</option>
        <option value="feedback">Feedback</option>
        <option value="other">Other</option>
      </StyledSelect>
      
      <StyledTextarea
        label="Message"
        id="message"
        name="message"
        value={formData.message}
        onChange={(e) => setFormData({...formData, message: e.target.value})}
        required
        rows={4}
      />
    </StyledForm>
  );
}
```

## Key Improvements

1. **Enhanced Visual Design**: Modern styling with consistent spacing, shadows, and visual hierarchy
2. **Prominent Action Buttons**: Clear, visually distinct save/cancel buttons with hover effects
3. **Loading States**: Visual feedback during form submission
4. **Validation Support**: Built-in error display and helper text
5. **Responsive Design**: Components adapt to different screen sizes
6. **Accessibility**: Proper labeling and keyboard navigation support
7. **Dark Mode Support**: Consistent styling in both light and dark modes

## Migration Guide

To upgrade existing forms to use these new components:

1. Import the components:
   ```jsx
   import { StyledForm, StyledInput } from '@/components';
   ```

2. Replace traditional form elements with the styled versions:
   ```jsx
   // Before
   <form onSubmit={handleSubmit}>
     <div className="mb-4">
       <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
         Name
       </label>
       <input
         type="text"
         className="shadow appearance-none border rounded w-full py-2 px-3"
         required
       />
     </div>
     <div className="flex justify-end">
       <button type="submit" className="bg-primary text-white py-2 px-4 rounded">
         Save
       </button>
     </div>
   </form>

   // After
   <StyledForm onSubmit={handleSubmit} submitButtonText="Save">
     <StyledInput
       label="Name"
       type="text"
       required
     />
   </StyledForm>
   ```