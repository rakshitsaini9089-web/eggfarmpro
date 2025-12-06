# Ports Configuration

This document outlines the port configuration for the Egg Farm Management System.

## Service Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Frontend Development Server | 3001 | HTTP | Next.js development server |
| Backend API Server | 5001 | HTTP | Express.js API server |
| MongoDB Database | 27017 | TCP | Default MongoDB port |

## Configuration Files

### Frontend
The frontend server port is configured in `frontend/package.json`:
```json
"scripts": {
  "dev": "next dev -p 3001",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Backend
The backend server port is configured in `backend/server.js`:
```javascript
const PORT = process.env.PORT || 5001;
```

You can override this by setting the PORT environment variable in your `.env` file:
```env
PORT=5001
```

## Accessing Services

### During Development
1. **Frontend**: http://localhost:3001
2. **Backend API**: http://localhost:5001/api/
3. **MongoDB**: mongodb://localhost:27017/eggfarm

### Example API Calls
- User login: `POST http://localhost:5001/api/auth/login`
- Client list: `GET http://localhost:5001/api/clients`
- Sales data: `GET http://localhost:5001/api/sales`

## Changing Ports

### Frontend
To change the frontend port, modify the `dev` script in `frontend/package.json`:
```json
"scripts": {
  "dev": "next dev -p YOUR_PORT_NUMBER",
}
```

### Backend
To change the backend port:
1. Set the PORT environment variable in `backend/.env`:
   ```env
   PORT=YOUR_PORT_NUMBER
   ```
2. Or modify the default in `backend/server.js`:
   ```javascript
   const PORT = process.env.PORT || YOUR_PORT_NUMBER;
   ```

## Troubleshooting

### Port Already in Use
If you encounter port conflicts:

1. **Find the process using the port**:
   ```bash
   # Windows
   netstat -ano | findstr :PORT_NUMBER
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -i :PORT_NUMBER
   kill -9 <PID>
   ```

2. **Use a different port** by modifying the configuration as described above.

### Connection Refused
If you get connection refused errors:

1. Ensure the services are running
2. Check that the ports match the configuration
3. Verify firewall settings
4. Confirm MongoDB is accessible on port 27017

## Production Deployment

In production, you may want to use different ports or deploy behind a reverse proxy (nginx, Apache, etc.) that handles port mapping.