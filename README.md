# Shift Schedule Management System v2.1

A multi-user web application for managing and tracking work shift schedules with support for Lunch (LN) and Dinner (DN) shifts.

## 📋 Key Features

### ✅ Completed Features

1. **User Authentication**
   - User registration and login
   - Individual user data management
   - Session persistence (localStorage)

2. **Shift Input**
   - Weekly schedule creation (Mon-Sun)
   - LN (Lunch) / DN (Dinner) shift separation
   - Daily shift input
   - Automatic rounding to 15-minute (0.25 hour) intervals
   - Real-time total calculations (Weekday/Saturday/Sunday)

3. **My Archive**
   - Weekly schedule saving
   - View past shift records
   - Download archives in Excel/PDF format
   - Delete archives

4. **All Staff View**
   - View all staff schedules for a specific week
   - Compact table format showing:
     - Staff name
     - LN/DN shifts by day
     - Daily and weekly totals
   - Download all schedules in Excel/PDF

5. **Data Export**
   - Excel file download (XLSX)
   - PDF file download
   - Individual/bulk download support

## 🗂️ Project Structure

```
.
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Stylesheets
├── js/
│   ├── auth.js            # Authentication management
│   ├── database.js        # Database API
│   ├── shift-manager.js   # Shift schedule management
│   ├── export.js          # PDF/Excel export
│   └── app.js             # Main application
├── README.md              # Project documentation
└── DEPLOYMENT.md          # Deployment guide
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI/UX**: Font Awesome icons
- **Data Storage**: RESTful Table API
- **Export**: 
  - jsPDF (PDF generation)
  - SheetJS (Excel generation)

## 📊 Data Models

### 1. users (Users)
- `id`: User unique ID
- `username`: User name
- `email`: Email (login ID)
- `password`: Password (hashed)
- `created_at`: Registration date

### 2. shifts (Shift Records)
- `id`: Shift record ID
- `user_id`: User ID
- `week_start`: Week start date
- `day_key`: Day key (mon~sun)
- `date_str`: Work date
- `ln_start`, `ln_end`, `ln_hours`: Lunch shift info
- `dn_start`, `dn_end`, `dn_hours`: Dinner shift info

### 3. archives (Archives)
- `id`: Archive ID
- `user_id`: User ID
- `username`: User name
- `week_start`: Week start date
- `label`: Week label
- `summary`: Summary information
- `weekday_total`, `saturday_total`, `sunday_total`: Period totals
- `total_hours`: Grand total
- `archived_at`: Archive date

## 🚀 Deployment Guide

### GitHub Pages

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/shift-scheduler.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository → Settings → Pages
   - Source: Select `main` branch
   - Click Save
   - URL: `https://your-username.github.io/shift-scheduler/`

### Cloudflare Pages

1. **Create Cloudflare Pages Project**
   - Visit [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Pages → Create a project
   - Connect GitHub repository

2. **Build Settings**
   - Build command: (leave empty - static site)
   - Build output directory: `/`
   - Deploy

3. **Custom Domain** (optional)
   - Pages project → Custom domains
   - Add domain and configure DNS

### Vercel

1. **Create Vercel Project**
   - Visit [Vercel](https://vercel.com/)
   - New Project
   - Import GitHub repository

2. **Deployment Settings**
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: ./
   - Click Deploy

## 📱 How to Use

### 1. Sign Up & Login
1. Access the app - login screen appears
2. Click "Sign up" to create an account
3. Login with email and password

### 2. Shift Input
1. In **My Shifts** tab, select "Week Start Date"
2. In daily input form:
   - Select date (day automatically set)
   - Enter LN/DN start/end times
   - Click "Apply to Schedule"
3. Automatically reflected in weekly schedule
4. View weekly totals

### 3. Save to Archive
1. After completing weekly shifts
2. Click "Save to Archive" button
3. View in **Archive** tab

### 4. View All Staff
1. Select **All Staff** tab
2. Choose week start date and click "Load"
3. View all staff schedules in compact format:
   ```
   Name | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Total
   LN   | ... | ... | ... | ... | ... | ... | ... |
   DN   | ... | ... | ... | ... | ... | ... | ... |
   Daily| ... | ... | ... | ... | ... | ... | ... | Total
   ```
4. Download Excel/PDF

### 5. Data Export
- **Individual Download**: Excel/PDF from My Shifts tab
- **Archive Download**: Per-item download from Archive tab
- **Bulk Download**: All staff schedules from All Staff tab

## 🎨 Features

- **Responsive Design**: Mobile, tablet, desktop support
- **Intuitive UI**: Tab-based navigation
- **Real-time Calculation**: Automatic 15-minute interval rounding
- **Multi-user**: Independent data management per user
- **Data Export**: Excel and PDF format support
- **Auto-save**: Immediate server save on input

## 🔒 Security Notes

**Current Implementation:**
- Simple password hashing (client-side)
- localStorage-based session management

**Production Recommendations:**
- Implement server-side authentication
- JWT token-based authentication
- Use strong hashing algorithms (bcrypt)
- Mandatory HTTPS

## 🛣️ Development Roadmap

### Phase 1 (Completed)
- ✅ Basic shift input functionality
- ✅ User authentication
- ✅ Archive feature
- ✅ All staff view with compact format
- ✅ Excel/PDF export

### Phase 2 (Future)
- ⬜ Shift pattern templates
- ⬜ Monthly statistics dashboard
- ⬜ Shift swap/replacement feature
- ⬜ Notification system
- ⬜ Admin permissions and approval system

### Phase 3 (Future)
- ⬜ Mobile app (PWA)
- ⬜ Real-time sync
- ⬜ Team/department management
- ⬜ Payroll calculation integration
- ⬜ Calendar integration (Google Calendar, iCal)

## 📄 License

This project is free to use for personal and commercial purposes.

## 🤝 Contributing

Submit bug reports or feature requests via GitHub Issues.

## 📞 Support

If you encounter issues or have questions, please create a GitHub Issue.

---

**Version**: 2.1  
**Last Updated**: 2025-01-01  
**Developer**: Shift Schedule Management Team
