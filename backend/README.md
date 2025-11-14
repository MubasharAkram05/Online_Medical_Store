# Online Medical Store API

## Environment Variables

Create a `.env` file in the `backend/` directory with the following keys:

```
PORT=4000
APP_NAME=Online Medical Store API

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=online_medical_store

JWT_ACCESS_SECRET=change_me_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Optional: auto-create admin user on startup
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=Admin@123
```

Update the values to match your local environment before running the server.

