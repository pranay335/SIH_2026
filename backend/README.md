# Backend API

This is the backend for the MINI Project.

## Getting Started

1. Install dependencies: `npm install`
2. Create a `.env` file with your environment variables (e.g., MONGO_URI, JWT_SECRET, PORT)
3. Run the server: `npm start`

## API Endpoints

- GET /api/users - Get all users
- POST /api/users - Create a new user

## Project Structure

- `src/index.js` - Entry point
- `src/app.js` - Express app setup
- `src/routes/` - Route handlers
- `src/controllers/` - Business logic
- `src/models/` - Data models
- `src/middleware/` - Custom middleware
- `src/config/` - Configuration
- `src/utils/` - Utilities
- `tests/` - Tests