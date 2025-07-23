# SmartFormAI - Internet Computer Integration

## Project Overview
SmartFormAI is a form generation and management platform deployed on Vercel at [https://smartformai.vercel.app/](https://smartformai.vercel.app/).

This repository includes Internet Computer (IC) integration as part of the ICP hackathon requirements.

## Internet Computer Configuration

### dfx.json Location
The `dfx.json` file is located in the root directory of the project.

### Canister Configuration
The project defines two canisters:
- **smartformai_frontend**: Assets canister pointing to the React frontend in `/src`
- **smartformai_backend**: JavaScript backend canister pointing to the Firebase functions in `/functions`

### Project Structure
- `/src`: Frontend React application
- `/functions`: Backend Firebase functions
- `/public`: Static assets
- `/components`: UI components

## Setup Instructions

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Firebase: Update `serviceAccountKey.json` in `/functions`
4. Set up environment variables: Copy `env.example` to `.env` and update values
5. Run the development server: `npm run dev`
6. Access at http://localhost:8080/

### Production
The application is deployed at [https://smartformai.vercel.app/](https://smartformai.vercel.app/)

## Data Persistence
User data is stored persistently in Firebase and accessible across sessions with authentication. Users can log in either locally or on the website to access their saved data.

## Technologies Used
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Firebase Functions (JavaScript)
- Deployment: Vercel
- Database: Firebase
- Authentication: Firebase Auth

## Internet Computer Integration Notes
While this project is primarily deployed on Vercel with Firebase as the backend, the `dfx.json` configuration demonstrates how the project could be adapted to run on the Internet Computer platform. 