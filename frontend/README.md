# SQL‑Visualizer

## Overview

SQL‑Visualizer is a modern web application that lets you write **SQL queries** and instantly see **visual representations** of the results. Built with a sleek, premium UI, it offers real‑time tables and charts, dark mode, and easy export options.

---

## Features

- Interactive query editor with syntax highlighting
- Real‑time results displayed in a responsive table
- Chart visualizations (bar, line, pie) generated from query results
- Dark mode with glass‑morphism styling
- Export results to CSV/JSON
- Supports PostgreSQL, MySQL, SQLite (configurable via the backend)

---

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, `node-postgres` (or `mysql2`/`sqlite3`)
- **Styling**: Tailwind CSS with custom dark theme and glass‑morphism effects
- **Testing**: Vitest & React Testing Library

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- A running SQL database (PostgreSQL, MySQL, or SQLite)

### Installation

```bash
# Clone the repo
git clone <repo‑url>
cd SQL-Visualizer

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../Backend
npm install
```

### Development

Open two terminals:

1. **Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will be served at `http://localhost:5173`.

2. **Backend**
   ```bash
   cd ../Backend
   npm start
   ```
   The API runs on `http://localhost:5000`.

### Production Build

```bash
cd frontend
npm run build
```
   The compiled static files appear in `dist/` and can be served by the Express backend or any static web server.

---

## Project Structure

```
SQL-Visualizer/
├─ Backend/          # Express API handling SQL execution
│   ├─ src/
│   └─ package.json
├─ frontend/         # React TypeScript UI
│   ├─ src/
│   │   ├─ components/   # Reusable UI components
│   │   ├─ pages/        # Main app pages (QueryEditor, Results, Settings)
│   │   └─ App.tsx
│   ├─ public/
│   ├─ tailwind.config.js
│   └─ vite.config.ts
└─ README.md         # This file
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/awesome-feature`)
3. Follow the existing ESLint configuration (see *Expanding the ESLint configuration* above)
4. Write tests for new functionality
5. Submit a pull request

---

## License

MIT © 2026 Somya Sharma

---

*Enjoy visualizing your data!*
