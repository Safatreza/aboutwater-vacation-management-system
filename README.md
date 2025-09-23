# AboutWater GmbH Vacation Management System

A comprehensive vacation tracking and management system built with Next.js, TypeScript, and Supabase for AboutWater GmbH.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Safatreza/aboutwater-vacation-management-system)

## 🚀 Features

### 📊 **Workbook Parity System**
> **NEW in 2025**: Exact Excel workbook behavior replication

The system automatically switches to workbook parity mode for year 2025, providing:
- **Fixed 365-Day Array**: 2025-01-01 to 2025-12-31 (D[0] to D[364])
- **Code-Driven Calculations**: Only daily leave codes (U/U2/G/G2/S/UU) affect totals
- **Visual Holiday Flags**: Weekends/holidays are visual indicators only
- **Bavaria Semantics**: Complete DE-BY holiday calendar with school breaks
- **Range Extraction**: Consecutive identical codes automatically grouped
- **Real-Time Totals**: `remaining = carryover + allowance - used_vacation`

**API Endpoints**:
- `/api/workbook/calendar` - 365-day date array with weekdays and flags
- `/api/workbook/reports` - Employee reports with exact calculations
- `/api/workbook/codes` - Daily code operations and date ranges
- `/api/workbook/employees` - Workbook employee management

### 🔥 **LATEST: Complete Workbook Parity System (2025)**
- **Exact Excel Behavior**: Perfect workbook replication with 365-day calculations
- **Canonical Leave Codes**: U, U2, G, G2, S, UU with precise value mappings
- **Bavaria Holiday Integration**: Complete 2025 calendar with Ferien/Feiertag/Betriebsschließung
- **Code-Driven Totals**: Only leave codes affect calculations, visual flags separate
- **Real AboutWater Employees**: Auto-populated with all 20 AboutWater team members
- **Dynamic Vacation Calculations**: Real-time used/remaining days calculation
- **Editable Allowances**: Click-to-edit vacation allowances with instant updates
- **Google Calendar Holidays**: Live German holiday sync from Google Calendar API
- **Zero Hardcoded Data**: Fully dynamic system with no fake or sample data

### 🎯 **Core Features**
- **Employee Management**: Add, edit, and manage employee vacation allowances
- **Vacation Tracking**: Track vacation requests, approvals, and remaining days
- **Holiday Integration**: Automatic sync with German holidays via Google Calendar API
- **Calendar View**: Visual calendar showing all vacations and holidays
- **Data Export**: Export vacation data to Excel for reporting
- **Email Backups**: Automated backup system with email notifications
- **Real-time Updates**: Live updates across all components
- **Professional Design**: AboutWater branding with modern UI

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with AboutWater branding
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Built-in authentication system
- **APIs**: Google Calendar API for holiday sync
- **Email**: Nodemailer with SMTP support
- **Deployment**: Vercel-optimized

## 📋 Prerequisites

Before deployment, ensure you have:

1. **Supabase Account**: [Create account](https://supabase.com)
2. **Google Cloud Console**: [Access console](https://console.cloud.google.com)
3. **Vercel Account**: [Create account](https://vercel.com)
4. **GitHub Account**: For repository hosting

## 🚀 One-Click Deployment

### Deploy to Vercel

1. Click the "Deploy with Vercel" button above
2. Fork/clone this repository to your GitHub
3. Connect your GitHub account to Vercel
4. Configure environment variables (see below)
5. Deploy!

### Manual Deployment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Safatreza/aboutwater-vacation-management-system.git
   cd aboutwater-vacation-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (see Environment Variables section)

4. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 🔧 Environment Variables

### Required Variables

Copy these to your Vercel Environment Variables:

#### Database (Required)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Google Calendar API (Required)
```bash
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CALENDAR_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
```

#### Application Settings
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Optional Variables

#### Email Service
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@aboutwater.de
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@aboutwater.de
EMAIL_TO=recipient@aboutwater.de
```

See `.env.example` for complete list and setup instructions.

## 🗄 Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: `aboutwater-vacation-dashboard`
   - **Database Password**: (save this securely)
   - **Region**: Europe (recommended for Germany)

### 2. Set Up Database Schema

Run the database migration script:

1. In your project directory:
   ```bash
   node create-tables.js
   ```

Or manually run the SQL in Supabase SQL Editor:

```sql
-- See create-tables.js for complete SQL schema
-- Creates: employees, vacations, holidays, settings tables
```

### 3. Configure API Keys

1. Go to **Project Settings** → **API**
2. Copy the following to your environment variables:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 🎯 Google Calendar API Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Calendar API:
   - Go to **APIs & Services** → **Library**
   - Search "Google Calendar API"
   - Click **Enable**

### 2. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key
4. **Restrict the key** (recommended):
   - Click on the API key
   - Under **API restrictions**, select **Restrict key**
   - Choose **Google Calendar API**
   - Save

### 3. Add to Environment Variables

Add the API key to all three variables:
- `GOOGLE_API_KEY`
- `GOOGLE_CALENDAR_API_KEY`
- `NEXT_PUBLIC_GOOGLE_API_KEY`

## 🔧 Local Development

1. **Clone and install**:
   ```bash
   git clone https://github.com/Safatreza/aboutwater-vacation-management-system.git
   cd aboutwater-vacation-management-system
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Database setup**:
   ```bash
   node create-tables.js
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access application**:
   - Local: `http://localhost:3000`
   - Dashboard: `http://localhost:3000/dashboard`

## Usage

### Login
- Use your Supabase admin credentials to log in

### Employee Management
- Add employees with their yearly vacation allowance
- Edit employee information and allowances
- Employees can be deactivated but not deleted (for data integrity)

### Vacation Management
- Add vacation periods for employees
- System automatically calculates working days (excluding weekends and holidays)
- Prevents overlapping vacation periods
- View all vacations for an employee with totals

### Holiday Management
- Sync German public holidays from Google Calendar
- Add custom company holidays
- All holidays are excluded from working day calculations

### Reports
- Export comprehensive Excel reports with:
  - Employee summary (allowance, used, remaining days)
  - Detailed vacation entries
  - Holiday listings
- Reports include AboutWater branding

## Database Schema

- **employees**: Employee information and allowances
- **vacations**: Vacation periods with date ranges
- **holidays**: German public and company holidays
- **settings**: Application configuration

## Working Day Calculation

The system uses sophisticated logic to calculate working days:
- Includes only Monday-Friday
- Excludes German public holidays and company holidays  
- Handles vacation periods spanning multiple years
- Ensures minimum 1 working day per vacation entry

## Security

- Admin-only access with Supabase authentication
- Row Level Security (RLS) policies
- Input validation and sanitization
- Secure API endpoints

## Production Deployment

1. Set up production Supabase project
2. Configure production environment variables
3. Deploy to Vercel, Netlify, or your preferred platform
4. Ensure Google Calendar API key has proper restrictions

## 📊 Monitoring & Analytics

### Health Checks
- **Endpoint**: `/api/health`
- **Monitoring**: Database connectivity, API status
- **Alerts**: Automatic degraded service detection

### Performance Optimization
- **Static Generation**: Optimized for Vercel
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js image optimization
- **Caching**: Intelligent caching strategies

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   npm run build
   # Check for TypeScript errors
   ```

2. **Database Connection**:
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure database schema is created

3. **Holiday Sync Issues**:
   - Verify Google API key
   - Check API quotas in Google Console
   - Ensure Calendar API is enabled

4. **Email Not Working**:
   - Verify SMTP settings
   - Check app password for Gmail
   - Test with simple SMTP client

### Support

For issues related to:
- **Application bugs**: Create GitHub issue
- **Deployment**: Check Vercel logs
- **Database**: Verify Supabase settings
- **API**: Check Google Cloud Console

## 📄 License

This project is proprietary software developed for AboutWater GmbH.

## 🏢 AboutWater GmbH

**AboutWater GmbH** - Leading water technology solutions provider.

- **Website**: [aboutwater.de](https://aboutwater.de)
- **Contact**: info@aboutwater.de
- **Location**: Germany

---

**Built with ❤️ for AboutWater GmbH**
