// ============================================================
// CONFIGURATION — Fill in your PocketBase server URL below
// ============================================================
// 1. Download PocketBase from https://pocketbase.io/docs/
// 2. Run: ./pocketbase serve
//    (starts at http://127.0.0.1:8090 by default)
// 3. Open http://127.0.0.1:8090/_/ and create your superuser account
// 4. Go to Settings > Import collections and load pocketbase/pb_schema.json
// 5. Add seed data (see pocketbase/pb_schema.json comments and README.md)
// 6. Register in the app, then in the PocketBase dashboard set your
//    user's 'role' field to 'admin'  — OR pre-add your email to the
//    admin_emails collection before registering.
// ============================================================

const POCKETBASE_URL = 'http://127.0.0.1:8090';

// App display name
const APP_NAME = 'Lunch Table Reservations';
const SCHOOL_NAME = 'Holsenbeck Elementary School';

// ============================================================
// DO NOT EDIT BELOW THIS LINE
// ============================================================
window.__APP_CONFIG__ = { POCKETBASE_URL, APP_NAME, SCHOOL_NAME };
