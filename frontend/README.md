# BCache – Bitcoin Cash Archival Project

BCache is a fast, simple, and permanent archival website dedicated to preserving important Bitcoin Cash (BCH) related videos. It combines a premium dark aesthetic with high performance to ensure history remains accessible and readable.

## 🚀 Purpose
- **Archive**: Securely catalogue important BCH videos and discussions.
- **Embed**: Watch videos directly on the site via seamless YouTube integration.
- **Permanence**: Provide fallback links to multiple alternative platforms (Odysee, Rumble, etc.) to ensure content never disappears.

## ✨ Key Features

### Core Pages
- **Home**: A curated landing page with horizontal scrolling rows for each category (e.g., Essential Viewing, Blocksize Wars).
- **Category Listing**: Explore the full breadth of archived topics organized by tags and collections.
- **Individual Video Page**: A dedicated space for each video featuring:
  - Embedded HD video player (YouTube).
  - Alternative platform links (Google Drive, Odysee, Rumble, BitChute).
  - Detailed descriptions, creator info, and upload dates.
  - Related videos from the same category.
- **Admin Panel**: A simple, unified backend interface to add, edit, or remove videos from the archive.

### Platforms & Links
BCache supports multiple platform mirrors for every video. If a mirror exists, it shows:
- 📺 **YouTube** (Embedded + Link)
- 📂 **Google Drive**
- 🌊 **Odysee**
- ⚡ **Rumble**
- 🧊 **BitChute**

### BCH Support
- **BCH Donations**: Integrated footer with a copyable Bitcoin Cash address and a generated QR code for community support.

### Design Requirements
- **Dark Theme**: Premium dark-mode aesthetic with high-contrast text for ultimate readability.
- **Mobile Responsive**: Fully optimized for phones, tablets, and desktops.
- **Minimalistic**: No heavy animations; focused on speed and content.

## 🛠 Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS v4.
- **Icons**: Lucide React.
- **Routing**: React Router Dom.
- **Backend**: Node.js + Express (Local File Storage).

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Application
Start both the **frontend** and the **backend server** simultaneously:
```bash
npm start
```

Before starting, create a local `.env` file from `.env.example`.

Generate admin credentials with:
```bash
node scripts/generate-admin-hash.mjs "your-strong-password"
```

Then copy the printed `ADMIN_PASSWORD_SALT` and `ADMIN_PASSWORD_HASH` into `.env`.

### 3. Build for Production
```bash
npm run build
```

## 📂 Project Structure
- `src/pages/`: Main application pages (Home, Video, Admin, etc.).
- `src/components/`: Reusable UI components (Layout, VideoCard).
- `src/data/`: Centralized `videos.json` for archival storage.
- `server.js`: Lightweight Express server to handle data persistence.

## Admin Security
- Read access to videos and categories is public.
- Creating categories is restricted to authenticated admins.
- Adding, editing, and deleting videos is restricted to authenticated admins.
- Admin credentials are checked on the server, not in the browser UI.
- The public site uses an `HttpOnly` admin session cookie instead of storing admin tokens in local storage.
- For internet deployment, use HTTPS and set `COOKIE_SECURE=true`.

---
**Build for the future of Bitcoin Cash. Simple. Fast. Permanent.**
