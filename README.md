# Pharma Auth Hub MERN Stack

This project rebuilds the site as a MERN application for pharma prior authorization operations, including login, authorization case management, appeals tracking, documentation intake, payer policy snapshots, and workspace settings.

## Structure

- `frontend/` React + Vite frontend
- `backend/` Express + MongoDB backend

## Demo Login

- Email: `ops@pharmaauthhub.com`
- Password: `Pharma123!`

## Run

1. Install dependencies:
   - `npm install`
   - `npm install --prefix frontend`
   - `npm install --prefix backend`
2. Start MongoDB and create `backend/.env` from `backend/.env.example`
3. Start both apps:
   - `npm run dev`

Frontend runs on `http://localhost:5173`
Backend runs on `http://localhost:5000`

## Backend Environment

- `PORT=5000`
- `MONGODB_URI=mongodb://127.0.0.1:27017/pharma-auth-hub`
- `JWT_SECRET=change-this-secret`
- `CLIENT_URL=http://localhost:5173`
