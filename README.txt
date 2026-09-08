StarRo Simulator - Admin + Supabase + GAME + CASH + Diagnostics

This package includes:
- admin.html: 10-section admin dashboard
- 🔧 Connection Diagnostics on the login screen
- GAME and CASH admin settings
- Supabase project URL + publishable key already configured

Diagnostics checks:
1. Browser online state
2. Current protocol (https/file)
3. Supabase Project URL
4. Publishable key loaded
5. Auth service health
6. REST site_config public read
7. Email/password credential check (only when both are entered)

If diagnosis reports Failed to fetch while opened with file://, upload to GitHub Pages and test via https://.../admin.html first.
Never place service_role / sb_secret keys in these frontend files.
