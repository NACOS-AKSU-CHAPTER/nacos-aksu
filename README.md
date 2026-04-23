# NACOS AKSU - Department Site

A modern web application for the Nigeria Association of Computing Students, AKSU chapter.

## Features

- 🎓 Course materials and resources organized by level (100-400)
- 📅 Events management and announcements
- 👥 Executive board profiles
- 📸 Photo gallery
- 💬 Anonymous suggestion box
- 🔐 Secure admin dashboard
- 📱 Fully responsive design with smooth scroll animations

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NACOS-AKSU-CHAPTER/nacos-aksu.git
cd nacos-aksu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:
   - Get these from your [Supabase Dashboard](https://supabase.com/dashboard)
   - Project Settings → API → Project URL and anon/public key

5. Set up the database:
   - Run the SQL migrations in `supabase/migrations/` in your Supabase SQL editor
   - Or use the Supabase CLI to apply migrations

6. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
```

⚠️ **Never commit your `.env` file to version control!**

## Deployment

This project can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static hosting service

Make sure to set your environment variables in your hosting platform's settings.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is maintained by NACOS AKSU Chapter.

## Contact

For questions or support, contact the NACOS AKSU executive board through the website's contact form.
