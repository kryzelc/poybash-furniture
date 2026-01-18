# Contributing to PoyBash Furniture

Thank you for your interest in contributing to PoyBash Furniture! This guide will help you get started with local development.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager
- Git

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/poybash-furniture.git
   cd poybash-furniture
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**

   ```bash
   # Copy the example environment file
   cp .env.example .env.local

   # Edit .env.local with your Supabase credentials
   # Get these from https://supabase.com/dashboard/project/_/settings/api
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Application

### Demo Accounts

The application includes demo accounts for testing different user roles:

**Owner Account (Full System Access)**

- Email: `owner@poybash.com`
- Password: `owner123`

**Admin Account (Operations Management)**

- Email: `admin@poybash.com`
- Password: `admin123`

See [DEMO_ACCOUNTS.md](./docs/DEMO_ACCOUNTS.md) for complete details on all demo accounts and their features.

## 📝 Development Workflow

### Building for Production

```bash
npm run build
npm run start
```

### Running Linter

```bash
npm run lint
```

## 🏗️ Architecture

This is a **frontend-only implementation** built with:

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Shadcn/UI** - UI components
- **Supabase** - Backend (PostgreSQL, Auth, Storage)

For comprehensive architecture details, see [SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md).

## 📚 Documentation

- **System Architecture**: [SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md)
- **Database Schema**: [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)
- **Role-Based Access Control**: [RBAC_SUMMARY.md](./docs/RBAC_SUMMARY.md)
- **Demo Accounts**: [DEMO_ACCOUNTS.md](./docs/DEMO_ACCOUNTS.md)

## 🔐 Security Notes

### Environment Variables

- **NEVER commit `.env.local` or any `.env` files** to version control
- The `.env.example` file contains only placeholder values
- All secrets are excluded via `.gitignore`

### Supabase Security

- This project uses Supabase's Row-Level Security (RLS) policies
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public
- Data access is controlled at the database level via RLS policies

## 🤝 Code Standards

- Use TypeScript for all new code
- Follow the existing project structure
- Maintain component modularity and reusability
- Document complex logic with comments
- Test your changes before submitting

## 🐛 Reporting Issues

If you find a bug or have a feature request:

1. Check existing issues to avoid duplicates
2. Create a clear issue with steps to reproduce
3. Include relevant screenshots or error messages

## 📄 License

[Add your license information here]

---

Happy coding! If you have questions, feel free to open an issue or reach out.
