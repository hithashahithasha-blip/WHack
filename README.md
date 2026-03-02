# Kerala Toilet Rating Website

A public toilet rating platform focused on Kerala travelers, featuring QR-based reviews, AI image verification for hygiene complaints, and integration with Suchitwa Mission.

## Features
- **Geolocation Map**: Interactive map using Leaflet.js to find nearby toilets.
- **QR Review**: Scan QR codes on-site to quickly rate a toilet.
- **AI Verification**: Automatic detection of hygiene issues (using Hugging Face API) for low-rated toilets.
- **Complaint Escalation**: Auto-file complaints with photo evidence to Suchitwa Mission Kerala if AI verifies the issue.

## Deployment Instructions

### 1. Prerequisite
- Node.js installed on your machine.
- MongoDB Atlas account (free tier works).
- Hugging Face API Token (optional, for real AI verification).

### 2. Local Setup
1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your MongoDB URI and other secrets.
4. Start the server:
   ```bash
   npm start
   ```
5. Open `index.html` in your browser.

### 3. Deploying to the Cloud
- **Backend (Node.js)**: 
  - Host on [Render.com](https://render.com/) or [Railway.app](https://railway.app/).
  - Set Environment Variables in the dashboard.
- **Frontend (HTML/JS)**:
  - Host on [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/).
  - Simply drag and drop the folder or connect via GitHub.
- **Database**:
  - Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

## Project Structure
- `index.html`, `style.css`, `app.js`: Frontend logic.
- `server.js`: Express.js backend.
- `package.json`: Dependencies.
- `uploads/`: Temporary storage for review photos.
