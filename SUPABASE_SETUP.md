# 🔄 **SUPABASE DATABASE SETUP INSTRUCTIONS**

## **CRITICAL: This system now uses REAL Supabase database for multi-user persistence**

### 📋 **Prerequisites**
- Supabase account (free tier works)
- The SQL script: `database-setup.sql`
- Environment variables properly configured

---

## **🚀 Step 1: Create Supabase Project**

1. Go to **https://supabase.com/dashboard**
2. Click **"New Project"**
3. **Project Name:** `aboutwater-vacation-dashboard`
4. **Organization:** Your organization
5. **Database Password:** Choose a strong password
6. **Region:** Choose closest to your users
7. Click **"Create new project"**

---

## **🗄️ Step 2: Create Database Tables**

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy and paste the entire contents of **`database-setup.sql`**
3. Click **"Run"** to execute the SQL script
4. **Verify setup:**
   ```sql
   SELECT COUNT(*) as employee_count FROM employees;
   SELECT COUNT(*) as vacation_count FROM vacations;
   ```
   - Should show 22 employees and 0 vacations initially

---

## **🔑 Step 3: Get API Credentials**

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL:** `https://your-project-id.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## **⚙️ Step 4: Configure Environment Variables**

### **For Local Development:**
Update your `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_FORCE_MOCK_MODE=false
NODE_ENV=development
```

### **For Vercel Deployment:**
1. Go to **Vercel Dashboard > Project Settings > Environment Variables**
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
   - `NEXT_PUBLIC_FORCE_MOCK_MODE` = `false`
3. Set **Environment** to: Production, Preview, Development
4. Click **"Save"**

---

## **✅ Step 5: Verify Setup**

### **Test Database Connection:**
```bash
npm run dev
```

1. Open **http://localhost:3000/dashboard**
2. Check browser console for:
   ```
   ✅ Supabase connection successful
   ✅ Loaded 22 employees from database
   ```

### **Test Multi-User Functionality:**
1. **Browser 1:** Add vacation for "Safat Majumder"
2. **Browser 2:** Open app in different browser/incognito
3. **Result:** Both browsers should show the same vacation data
4. **Server Restart:** Data should persist after `npm run dev` restart

---

## **🔍 Database Schema**

### **Employees Table:**
```sql
- id (UUID, Primary Key)
- name (TEXT)
- allowance_days (DECIMAL)
- used_days (DECIMAL)
- remaining_days (DECIMAL)
- color_code (TEXT)
- created_at (TIMESTAMP)
```

### **Vacations Table:**
```sql
- id (UUID, Primary Key)
- employee_id (UUID, Foreign Key → employees.id)
- start_date (DATE)
- end_date (DATE)
- days_count (DECIMAL)
- reason (TEXT)
- created_at (TIMESTAMP)
```

---

## **🚨 Troubleshooting**

### **❌ "Supabase environment variables missing"**
- Check `.env.local` file exists and has correct values
- Restart development server: `npm run dev`

### **❌ "Connection test failed"**
- Verify Supabase project is active (not paused)
- Check API credentials are correct
- Ensure Row Level Security policies allow access

### **❌ "Could not find table"**
- Run the `database-setup.sql` script in Supabase SQL Editor
- Check tables exist: Go to **Table Editor** in Supabase dashboard

### **❌ Two browsers don't share data**
- Verify environment variables are set correctly
- Check browser console for database connection logs
- Ensure tables have data: Check Supabase **Table Editor**

---

## **📊 Database Operations**

The system uses these **REAL** database functions:

- **`getEmployees()`** - Loads all employees from Supabase
- **`addVacationToDb()`** - Saves vacation to Supabase with employee updates
- **`deleteVacationFromDb()`** - Deletes vacation and recalculates employee totals
- **`generateExcelFromDatabase()`** - Exports Excel from Supabase data

**No localStorage is used** - everything goes through Supabase for true multi-user persistence.

---

## **🎯 Success Criteria**

✅ **Multi-User Sharing:** User 1 adds vacation → User 2 sees it immediately
✅ **Data Persistence:** Vercel restarts preserve all data
✅ **Real Database:** All operations use Supabase (not localStorage)
✅ **Excel Export:** Generates from database data

**The system is now ready for production with real multi-user support!** 🚀