# Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- Node.js (version 16 or higher)
- MongoDB (local installation or cloud instance like MongoDB Atlas)
- npm (comes with Node.js) or yarn package manager

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```
   This will install all required packages including:
   - express: Web framework
   - mongoose: MongoDB object modeling
   - cors: Cross-origin resource sharing
   - dotenv: Environment variable management
   - bcryptjs: Password hashing
   - jsonwebtoken: JWT token generation
   - multer: File upload handling
   - tesseract.js: OCR processing

3. **Configure environment variables:**
   Create a `.env` file in the backend directory with the following content:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/eggfarm
   JWT_SECRET=your_jwt_secret_key_here
   ```
   
   Adjust the `MONGODB_URI` if you're using a different MongoDB setup.

4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The backend server will start on port 5001 by default.

## Frontend Setup

1. **Navigate to the frontend directory (in a new terminal):**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```
   This will install all required packages including:
   - next: React framework
   - react and react-dom: Core React libraries
   - typescript: Type checking
   - tailwindcss: Utility-first CSS framework

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The frontend will start on port 3001 by default.

## Accessing the Application

Once both servers are running:
1. Open your browser and navigate to `http://localhost:3001`
2. You should see the Egg Farm Management System dashboard

## Project Structure Overview

### Backend (`backend/`)
- `server.js`: Main entry point
- `src/models/`: Database models (Client, Sale, Payment, etc.)
- `src/routes/`: API endpoints
- `src/controllers/`: Request handlers
- `src/utils/`: Utility functions (OCR service)
- `uploads/`: Directory for uploaded screenshots

### Frontend (`frontend/`)
- `src/app/`: Next.js App Router pages
- `src/components/`: Reusable UI components
- `src/lib/`: Utility functions and API services
- `src/types/`: TypeScript type definitions
- `tailwind.config.ts`: Tailwind CSS configuration

## Development Workflow

### Backend Development
1. All API routes are in `src/routes/`
2. Database models are in `src/models/`
3. Utility functions are in `src/utils/`
4. Changes automatically restart the server (nodemon)

### Frontend Development
1. Pages are in `src/app/` directory following Next.js App Router structure
2. Components are in `src/components/`
3. API service functions are in `src/lib/api.ts`
4. Styles are handled by Tailwind CSS
5. Fast Refresh automatically updates the browser on code changes

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run start
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change the PORT in `.env` file
   - Or kill the process using the port:
     ```bash
     # On Windows
     netstat -ano | findstr :5001
     taskkill /PID <PID> /F
     
     # On Mac/Linux
     lsof -i :5001
     kill -9 <PID>
     ```

2. **MongoDB connection error:**
   - Ensure MongoDB is running
   - Check your `MONGODB_URI` in the `.env` file
   - For MongoDB Atlas, ensure your IP is whitelisted

3. **Dependency installation errors:**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json` and reinstall:
     ```bash
     rm -rf node_modules package-lock.json
     npm install
     ```

4. **TypeScript errors:**
   - Ensure all dependencies are installed
   - Restart the TypeScript server in your IDE

### Useful Commands

- **Check Node.js version:**
  ```bash
  node --version
  ```

- **Check npm version:**
  ```bash
  npm --version
  ```

- **View MongoDB status (if installed locally):**
  ```bash
  # On Windows
  net start MongoDB
  
  # On Mac (with Homebrew)
  brew services list | grep mongodb
  
  # On Linux
  sudo systemctl status mongod
  ```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tesseract.js Documentation](https://github.com/naptha/tesseract.js)

## Support

For issues with this setup, please:
1. Check the console for error messages
2. Verify all prerequisites are installed
3. Ensure environment variables are correctly configured
4. Refer to the project README for additional details