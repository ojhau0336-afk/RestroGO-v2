# RestroGo v2 — Premium Multi-Tenant Restaurant SaaS

## Folder Structure

```
restrogov2/
├── index.html          → Master landing page (demo selector, pricing, features)
├── menu.html           → Customer ordering page (works for all 5 demo types)
├── kitchen.html        → Live kitchen display dashboard
├── owner.html          → Owner dashboard (branding, menu, orders, QR, analytics)
├── login.html          → Owner login (to be built - Phase 6)
├── register.html       → Restaurant registration (to be built - Phase 6)
├── admin/
│   └── index.html      → Platform admin panel (to be built - Phase 7)
├── core/
│   ├── firebase-config.js   → Firebase initialization (add YOUR credentials here)
│   └── tenant-engine.js     → Multi-tenant config, theme application, 5 demo configs
├── assets/
│   ├── css/
│   │   ├── base.css         → Shared design system (CSS variables, buttons, cards)
│   │   ├── landing.css      → Landing page styles
│   │   ├── menu.css         → Customer ordering page styles
│   │   ├── kitchen.css      → Kitchen display styles
│   │   └── owner.css        → Owner dashboard styles
│   └── js/
│       ├── utils.js         → Toast, QR, format helpers, lazy images
│       ├── landing.js       → Landing page JS
│       ├── menu.js          → Menu rendering, cart, order placement
│       ├── kitchen.js       → Real-time order stream, kitchen board
│       └── owner.js         → Full owner dashboard JS
└── functions/
    └── database.rules.json  → Firebase Realtime Database security rules
```

## Quick Start (Demo Mode)

Open any page with a `?demo=` parameter — no Firebase needed:

| Demo | URL |
|------|-----|
| Fine Dining | `menu.html?demo=restaurant` |
| Modern Cafe | `menu.html?demo=cafe` |
| Premium Bakery | `menu.html?demo=bakery` |
| Indian Sweets | `menu.html?demo=sweets` |
| Fast Food | `menu.html?demo=fastfood` |

Kitchen: `kitchen.html?demo=restaurant`  
Owner Dashboard: `owner.html?demo=restaurant`

## Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Realtime Database** (choose a region)
3. Enable **Authentication** (Email/Password)
4. Enable **Storage**
5. Copy your config into `core/firebase-config.js`
6. Deploy `functions/database.rules.json` as your database rules

## Owner Branding Features

In `owner.html` → **Branding** tab:
- Upload or paste logo (emoji or image)
- Color picker for primary, background, card, and text colors
- 5 one-click preset themes
- Upload or paste banner/hero image URL
- Edit business name, tagline, address, hours, phone
- Live phone preview updates instantly as you change settings

## Multi-Tenant URLs

Real restaurants use:
- Customer: `menu.html?restaurant=YOUR_TENANT_ID&table=1`
- Kitchen: `kitchen.html?restaurant=YOUR_TENANT_ID`
- Owner: `owner.html?restaurant=YOUR_TENANT_ID`

## GitHub Pages Deployment

This project uses relative paths throughout. To deploy to GitHub Pages:

1. Push to a repo named `RestroGo`
2. Enable GitHub Pages (Settings → Pages → Deploy from branch)
3. All paths work as-is under `/RestroGo/restrogov2/`

## Security Notes

- Never commit your real Firebase credentials to a public repo
- Use `.env` or GitHub Secrets for CI/CD environments  
- The `database.rules.json` enforces tenant isolation — deploy it
- Subscription and trial validation should use Cloud Functions (Phase 7)
