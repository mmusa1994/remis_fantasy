# REMIS Fantasy Landing Page 🏆

A modern, interactive landing page for the REMIS Fantasy Premier League mini-league featuring the "Wall of Champions" and registration system for the 2025/26 season.

## ✨ Features

- **Interactive Hero Section** with parallax effects and animated elements
- **Champions Showcase** with flip-card animations displaying past season winners
- **Dynamic Rules Section** with expandable accordions explaining new 2025/26 rules
- **Animated Registration Form** with real-time validation and smooth animations
- **Supabase Integration** for storing user registrations
- **Performance Optimized** with lazy loading and smooth 60fps animations
- **Fully Responsive** design for desktop and mobile

## 🚀 Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Supabase** for database and authentication
- **Lucide React** for icons

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Create Database Tables

Run the SQL commands in `supabase-setup.sql` in your Supabase SQL Editor to create the registrations table.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## 🎨 Design Features

### New 2025/26 Season Rules

- **CBIT/CBIRT Scoring**: Enhanced defensive player scoring system
- **Dual Chip Strategy**: Two distinct chip sets for different play styles
- **Mini-League Exclusivity**: Invitation-only competition format

### Interactive Elements

- Parallax hero section with animated background elements
- Champion cards with 3D flip animations on hover
- Smooth accordion interfaces for rules explanations
- Form animations with real-time validation feedback

## 🗄️ Database Schema

```sql
-- registrations table
id (UUID, PRIMARY KEY)
name (TEXT, NOT NULL)
email (TEXT, NOT NULL, UNIQUE)
league_code (TEXT, NULLABLE)
created_at (TIMESTAMP WITH TIME ZONE)
```

## 🎯 Future Enhancements

- Admin panel for managing registrations
- Email notifications for new registrations
- Champion photo upload functionality
- Advanced analytics and reporting
- Integration with Fantasy Premier League API

## 📱 Performance

- Optimized for Lighthouse scores 90+
- Smooth 60fps animations
- Mobile-first responsive design
- Lazy loading for optimal performance

## CodeRabbit

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/mmusa1994/remis_fantasy?utm_source=oss&utm_medium=github&utm_campaign=mmusa1994%2Fremis_fantasy&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## 🤝 Contributing

This is a private mini-league project. Contact the league administrator for access or questions.

---

Built with ❤️ for the REMIS Fantasy Premier League community
