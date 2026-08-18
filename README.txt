Mahaprabhu Stores

Admin security setup:
1. Customer site no longer shows an Admin Panel link.
2. Admin dashboard is protected by login.
3. Set these Render environment variables before deploying:
   ADMIN_USERNAME = choose your private username
   ADMIN_PASSWORD = choose a strong private password
   SESSION_SECRET = a long random secret (at least 32 characters)
4. Admin login URL: /admin-login
5. After login, the dashboard opens at: /manage-7f3k9

Do not share your ADMIN_PASSWORD or SESSION_SECRET.
