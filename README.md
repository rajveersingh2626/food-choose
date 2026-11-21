# Culinary Partner (food-choose)

<p align="left">
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
</p>

A web application built to help figure out what to cook based on whatever ingredients are already in the kitchen.

---

## What It Does

- Suggests recipes and meal ideas using the Google Gemini API based on ingredients on hand and available cooking time.
- Keeps track of pantry items and grocery lists with Supabase handling the backend storage.
- Designed as an installable progressive web app (PWA) with simple, smooth transitions.

---

## Tech Stack

- Frontend: React 18, Vite, JavaScript
- Styling & Animations: Tailwind CSS, Framer Motion
- AI: Google Gemini API (`@google/genai`)
- Database: Supabase (`@supabase/supabase-js`)

---

## Setup

### Requirements
- Node.js 18 or higher
- A Supabase account and project
- A Google Gemini API key

### Environment Variables
Create a `.env` file in the root folder:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
git clone https://github.com/rajveersingh2626/food-choose.git
cd food-choose
npm install
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```
