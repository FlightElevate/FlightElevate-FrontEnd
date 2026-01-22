# Deployment Guide for FlightElevate Frontend

## 404 Error Fix for React Router

When deploying a React SPA (Single Page Application), all routes need to fallback to `index.html` so React Router can handle routing on the client side.

### For Apache Server (.htaccess)

The `.htaccess` file is already in the `public/` folder and will be copied to `dist/` during build.

**Make sure your Apache server has `mod_rewrite` enabled:**
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### For Nginx

Add this to your Nginx server block:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

See `nginx.conf.example` for full configuration.

### For Vercel

The `vercel.json` file is already configured. Just deploy to Vercel.

### For Netlify

Create `public/_redirects` file:
```
/*    /index.html   200
```

### Build and Deploy

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist/` folder to your server.

3. Make sure your server is configured to:
   - Serve `index.html` for all routes (404 fallback)
   - Serve static assets from the `dist/` folder

### Testing

After deployment, test:
- Direct URL access: `https://yourdomain.com/dashboard`
- Page refresh on any route
- Navigation between pages

All should work without 404 errors.
