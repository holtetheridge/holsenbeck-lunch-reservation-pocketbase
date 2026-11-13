# Holsenbeck Lunch Reservation — PocketBase Edition

A self-hosted lunch table reservation system for Holsenbeck Elementary School, powered by [PocketBase v0.42.0+](https://pocketbase.io).

## Quick Start

### 1. Run PocketBase v0.42.0+
```bash
./pocketbase serve
# PocketBase starts at http://127.0.0.1:8090
```

### 2. Set up admin account
Open http://127.0.0.1:8090/_/ in your browser and create your superuser account.

### 3. Import the schema
- Dashboard → Settings → Import collections → select `pocketbase/pb_schema.json`
- Confirm the import (this creates all 8 collections with the correct API rules)

### 4. Seed initial data
In the PocketBase dashboard, create these records manually (or via the API):

**settings collection** (3 required records):
| key | value |
|-----|-------|
| `table_count` | `10` |
| `advance_booking_days` | `2` |
| `available_weekdays` | `[1,2,3,4,5]` |

**timeslots collection** (example):
| name | start_time | end_time | sort_order | is_active |
|------|-----------|---------|------------|-----------|
| 1st Lunch | 10:30:00 | 11:00:00 | 1 | true |
| 2nd Lunch | 11:00:00 | 11:30:00 | 2 | true |
| 3rd Lunch | 11:30:00 | 12:00:00 | 3 | true |

**email_templates collection** — add records with `template_key` = `approved`, `rejected`, `cancelled`.

### 5. Serve the app
```powershell
.\serve.ps1        # Windows PowerShell
# or
python -m http.server 8080   # Python 3
```
Open http://localhost:8080

### 6. Register first admin
1. Register in the app using your email
2. In PocketBase dashboard → users collection → find your record → set `role` = `admin`
3. Refresh the app — admin menu items appear

---

## File Structure
```
holsenbeck-lunch-reservation-pocketbase2/
├── index.html              # App shell (loads PocketBase SDK from CDN)
├── config.js               # Set POCKETBASE_URL here
├── styles.css              # All styles (unchanged from original)
├── serve.ps1               # Local dev server
├── js/
│   ├── utils.js            # PocketBase init, data loaders, helpers
│   ├── auth.js             # Login / register / password reset
│   ├── layout.js           # Nav + page router
│   ├── main.js             # Entry point, event wiring, reservation submit
│   ├── pages-parent.js     # Parent dashboard, reservations, calendar
│   └── pages-admin.js      # Admin dashboard, approvals, settings, reports
└── pocketbase/
    └── pb_schema.json      # Import this into PocketBase → Settings → Import collections
```

---

## Supabase → PocketBase Migration Map

| Supabase | PocketBase |
|----------|-----------|
| `supabase.createClient(url, key)` | `new PocketBase(url)` |
| `sb.auth.signInWithPassword({email,password})` | `pb.collection('users').authWithPassword(email, password)` |
| `sb.auth.signUp({email,password,options:{data:{full_name}}})` | `pb.collection('users').create({email,password,passwordConfirm,name,role})` |
| `sb.auth.signOut()` | `pb.authStore.clear()` |
| `sb.auth.getSession()` | `pb.authStore.isValid && pb.authStore.record` |
| `sb.auth.resetPasswordForEmail(email)` | `pb.collection('users').requestPasswordReset(email)` |
| `sb.auth.updateUser({password})` | `pb.collection('users').confirmPasswordReset(token, newPw, confirmPw)` |
| `sb.auth.onAuthStateChange(fn)` | `pb.authStore.onChange(fn, false)` |
| `sb.from('table').select('*')` | `pb.collection('table').getFullList()` |
| `.eq('col', val)` | `filter: pb.filter('col={:v}', {v: val})` |
| `.order('col', {ascending:false})` | `sort: '-col'` |
| `.select('*, rel(*)')` (join) | `expand: 'rel_field_name'` → result in `record.expand.rel_field_name` |
| `sb.from('t').insert(data)` | `pb.collection('t').create(data)` |
| `sb.from('t').update(data).eq('id', id)` | `pb.collection('t').update(id, data)` |
| `sb.from('t').delete().eq('id', id)` | `pb.collection('t').delete(id)` |
| `.single()` | `.getOne(id)` or `.getFirstListItem(filter)` |
| Supabase profiles table | PocketBase `users` auth collection (`name`, `role` fields) |
| Supabase RLS policies | PocketBase API rules on each collection |
| Supabase Edge Functions (send-email) | PocketBase Go/JS hooks at `/api/send-email` (optional) |
| `taken_slots` view | Direct query on `reservations` with `status="pending"\|\|status="approved"` |

---

## Email Setup
PocketBase uses SMTP for password-reset emails:
- Dashboard → Settings → Mail settings → configure SMTP

For **reservation notification emails** (approved/rejected/cancelled), the app falls back to `mailto:` if no custom hook is configured. To enable server-side email:
1. Write a PocketBase JS hook in `pocketbase/hooks/send_email.js`
2. The hook listens on `POST /api/send-email` and sends via your SMTP provider

---

## Collections & API Rules Summary

| Collection | List/View | Create | Update | Delete |
|---|---|---|---|---|
| `users` (auth) | Authenticated | Anyone | Owner or admin | Admin only |
| `admin_emails` | Admin only | Admin only | Admin only | Admin only |
| `settings` | Authenticated | Admin only | Admin only | Admin only |
| `timeslots` | Authenticated | Admin only | Admin only | Admin only |
| `school_breaks` | Authenticated | Admin only | Admin only | Admin only |
| `reservations` | Own records + admin | Authenticated (own user_id only) | Admin only | Admin only |
| `email_templates` | Admin only | Admin only | Admin only | Admin only |
| `day_scenarios` | Authenticated | Admin only | Admin only | Admin only |
