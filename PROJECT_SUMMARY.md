# Egg Farm Management System - Project Summary

## Project Overview

This is a complete full-stack web application for managing an egg farm business with features for client management, sales tracking, payment processing, expense management, chick vaccination scheduling, and OCR-based payment verification.

## Technology Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **React Hooks** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Tesseract.js** for OCR functionality
- **Multer** for file uploads

## Features Implemented

### 1. Dashboard
- Today's sales overview
- Cash vs UPI payment tracking
- Total due amounts
- Daily profit calculations
- 30-day profit trend visualization
- Quick action buttons
- Upcoming vaccinations display

### 2. Client Management + Khata Ledger
- Add/edit client information (name, phone, rate per tray)
- Automatic egg calculation (1 tray = 30 eggs)
- Running balance ledger
- Support for multiple payment methods (cash + UPI)
- PDF export functionality (planned)

### 3. Payment Screenshot OCR System
- Owner uploads payment screenshots
- Server-side OCR processing with Tesseract.js
- Automatic extraction of amount, UTR, date, and payer name
- Smart client matching based on amount/pattern/history
- Duplicate detection using UTR and image hashing
- Single UPI ID for all clients

### 4. Profit Calculation
- Automated profit computation (Sales - Expenses)
- Daily, weekly, and monthly profit tracking
- Profit trend analysis
- High-expense alerts

### 5. Chicks Vaccination Module
- Batch management (name, quantity, hatch date, breed)
- Auto-generated vaccination schedules
- Vaccine status tracking (Pending, Done, Missed)
- Vaccine inventory management with stock tracking
- Vaccination reminders
- Certificate generation (PDF) (planned)
- Upcoming vaccines display on dashboard

### 6. Expense Tracking
- Categorize expenses (feed, labor, electricity, medicine, transport, vaccine)
- Date-based expense logging
- Expense reporting

## Project Structure

```
egg-farm-management-system/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── clients/
│   │   │   │   └── page.tsx  # Client management
│   │   │   ├── sales/
│   │   │   │   └── page.tsx  # Sales tracking
│   │   │   ├── payments/
│   │   │   │   └── page.tsx  # Payment management
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx  # Expense tracking
│   │   │   ├── chicks/
│   │   │   │   └── page.tsx  # Chick batch management
│   │   │   ├── vaccination/
│   │   │   │   └── page.tsx  # Vaccination scheduling
│   │   │   └── ocr/
│   │   │       └── page.tsx  # OCR payment processing
│   │   ├── components/       # Reusable UI components
│   │   │   └── Layout.tsx    # Main layout component
│   │   ├── lib/              # Utility functions and API services
│   │   │   └── api.ts        # API service functions
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   ├── tailwind.config.ts    # TailwindCSS configuration
│   └── tsconfig.json         # TypeScript configuration
└── backend/                  # Express.js backend
    ├── src/
    │   ├── controllers/      # Request handlers
    │   │   ├── dashboardController.js  # Dashboard statistics
    │   ├── models/           # Mongoose models
    │   │   ├── Client.js     # Client model
    │   │   ├── Sale.js       # Sale model
    │   │   ├── Payment.js    # Payment model
    │   │   ├── Expense.js    # Expense model
    │   │   ├── Batch.js      # Batch model
    │   │   ├── Vaccine.js    # Vaccine model
    │   │   └── ScreenshotUpload.js  # Screenshot upload model
    │   ├── routes/           # API routes
    │   │   ├── clients.js    # Client routes
    │   │   ├── sales.js      # Sale routes
    │   │   ├── payments.js   # Payment routes
    │   │   ├── expenses.js   # Expense routes
    │   │   ├── batches.js    # Batch routes
    │   │   ├── vaccines.js   # Vaccine routes
    │   │   ├── screenshots.js # Screenshot routes
    │   │   └── index.js      # Main router
    │   ├── middleware/       # Custom middleware
    │   ├── config/           # Configuration files
    │   └── utils/            # Utility functions
    │       └── ocrService.js # OCR processing service
    ├── uploads/              # Uploaded files (screenshots)
    ├── server.js             # Entry point
    └── package.json          # Dependencies
```

## Color Scheme

- **Primary Color**: Green (#2F855A)
- **Background**: Clean white
- **Accents**: Soft shadows and subtle gradients
- **Status Colors**:
  - Green: Done
  - Yellow: Pending
  - Red: Missed

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd egg-farm-management-system
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configure environment variables**
   - Create `.env` file in the backend directory
   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `JWT_SECRET` for authentication (if implementing)

5. **Start the development servers**
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory (separate terminal)
   npm run dev
   ```

### Deployment

1. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start production servers**
   ```bash
   # Backend
   cd backend
   npm start
   
   # Serve frontend build (using any static server)
   ```

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Batches
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get batch by ID
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch

### Vaccines
- `GET /api/vaccines` - Get all vaccines
- `GET /api/vaccines/batch/:batchId` - Get vaccines by batch ID
- `GET /api/vaccines/:id` - Get vaccine by ID
- `POST /api/vaccines` - Create new vaccine
- `PUT /api/vaccines/:id` - Update vaccine
- `DELETE /api/vaccines/:id` - Delete vaccine

### Screenshots
- `POST /api/screenshots/upload` - Upload screenshot
- `GET /api/screenshots` - Get all screenshots
- `GET /api/screenshots/:id` - Get screenshot by ID
- `PUT /api/screenshots/:id/confirm` - Confirm screenshot match
- `DELETE /api/screenshots/:id` - Delete screenshot

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Future Enhancements

1. **Authentication System**
   - JWT-based user authentication
   - Role-based access control

2. **Advanced Reporting**
   - Export to PDF/Excel
   - Custom report generation
   - Data visualization improvements

3. **Mobile Responsiveness**
   - Enhanced mobile UI/UX
   - Progressive Web App (PWA) support

4. **Inventory Management**
   - Feed inventory tracking
   - Medicine stock management
   - Automated reorder alerts

5. **Notification System**
   - Email/SMS notifications
   - Vaccination reminders
   - Payment due alerts

6. **Audit Trail**
   - User activity logging
   - Data change tracking
   - Compliance reporting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the open-source community for the amazing tools and libraries
- Special thanks to Tesseract.js for OCR functionality
- Inspired by real-world agricultural management needs