# ACP PDF Renamer

A Next.js web application that renames membership statement PDFs using the statement end date. Upload a PDF containing a "Statement Period" and get it renamed to the format: `Membership Statement - YYYY MM DD.pdf`.

## Features

- 📄 Upload PDF files via drag & drop or file picker
- 🔍 Automatically extract text from PDFs
- 📅 Parse "Statement Period" to find the end date
- 🏷️ Rename files to standardized format
- ⬇️ Download the renamed PDF

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it works

1. Upload a PDF containing a "Statement Period" in the format:
   ```
   Statement Period
   01/01/2025 – 03/31/2025
   ```

2. The app extracts the end date (03/31/2025) and converts it to YYYY MM DD format (2025 03 31)

3. The file is renamed to: `Membership Statement - 2025 03 31.pdf`

## Deployment to Vercel

This app is ready to deploy to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy!

Or use the Vercel CLI:
```bash
npm install -g vercel
vercel
```

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **pdf-parse** - PDF text extraction
- **Vercel** - Deployment platform

## API Endpoint

- `POST /api/process-pdf` - Accepts PDF file and returns processed result with new filename 