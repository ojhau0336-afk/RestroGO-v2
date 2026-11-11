/**
 * RestroGo v2 — Tenant Engine
 * Handles all multi-tenant logic: config loading, theme application,
 * URL param parsing, and tenant-scoped Firebase paths.
 */

/* ─────────────────────────────────────────
   DEMO CONFIGURATIONS  (5 premium demos)
───────────────────────────────────────── */
const DEMO_CONFIGS = {

  restaurant: {
    tenantId:       "demo-restaurant",
    businessName:   "La Maison Élégante",
    tagline:        "Fine Dining, Timeless Moments",
    businessType:   "fine-dining",
    logo:           "🍽️",
    logoText:       "La Maison",
    currency:       "₹",
    currencySymbol: "₹",
    primaryColor:   "#1a1a2e",
    secondaryColor: "#c9a84c",
    accentColor:    "#f5f0e8",
    bgColor:        "#0f0f1a",
    textColor:      "#f5f0e8",
    mutedColor:     "#a89878",
    cardColor:      "#1e1e32",
    fontHeading:    "'Playfair Display', Georgia, serif",
    fontBody:       "'Lato', system-ui, sans-serif",
    heroImage:      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
    features:       ["table-reservation", "dine-in", "takeaway", "wine-pairing"],
    address:        "12 Boulevard Classique, Mumbai 400001",
    phone:          "+91 22 1234 5678",
    hours:          "12:00 PM – 11:00 PM",
    categories: [
      { id: "starters",   name: "Starters",       icon: "🥗" },
      { id: "mains",      name: "Main Course",    icon: "🍖" },
      { id: "pasta",      name: "Pasta & Risotto",icon: "🍝" },
      { id: "desserts",   name: "Desserts",        icon: "🍮" },
      { id: "beverages",  name: "Beverages",       icon: "🍷" }
    ],
    menu: [
      { id:"r1",  cat:"starters",  name:"Burrata Caprese",       price:680,  veg:true,  desc:"Fresh burrata, heirloom tomatoes, aged balsamic reduction",        img:"https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&q=75", popular:true  },
      { id:"r2",  cat:"starters",  name:"Foie Gras Torchon",     price:1200, veg:false, desc:"Pan-seared foie gras, brioche, fig compote",                        img:"https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&q=75", popular:false },
      { id:"r3",  cat:"mains",     name:"Beef Wellington",        price:2800, veg:false, desc:"Tenderloin wrapped in mushroom duxelles & golden puff pastry",      img:"https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=75", popular:true  },
      { id:"r4",  cat:"mains",     name:"Truffle Risotto",        price:1450, veg:true,  desc:"Arborio rice, black truffle, aged parmesan, truffle oil",           img:"https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=75", popular:true  },
      { id:"r5",  cat:"pasta",     name:"Lobster Linguine",       price:1800, veg:false, desc:"Fresh lobster, cherry tomatoes, white wine, chilli",                img:"https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=75", popular:false },
      { id:"r6",  cat:"pasta",     name:"Cacio e Pepe",           price:890,  veg:true,  desc:"Hand-rolled tonnarelli, Pecorino Romano, Tellicherry pepper",       img:"https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=75", popular:false },
      { id:"r7",  cat:"desserts",  name:"Soufflé au Chocolat",    price:580,  veg:true,  desc:"Dark Valrhona chocolate soufflé, vanilla crème anglaise",           img:"https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=75", popular:true  },
      { id:"r8",  cat:"beverages", name:"Château Margaux Glass",  price:1600, veg:true,  desc:"Premier Grand Cru Classé, full-bodied red",                         img:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=75", popular:false }
    ],
    banners: [
      { title:"Chef's Table Experience", subtitle:"Exclusive 7-course tasting menu", cta:"Reserve Now", bg:"#2a1a0e" },
      { title:"Wine Cellar Selection",   subtitle:"Over 200 curated labels",         cta:"View Cellar",  bg:"#1a2a1a" }
    ]
  },

  cafe: {
    tenantId:       "demo-cafe",
    businessName:   "The Velvet Cup",
    tagline:        "Slow Coffee, Good Moments",
    businessType:   "cafe",
    logo:           "☕",
    logoText:       "Velvet Cup",
    currency:       "₹",
    currencySymbol: "₹",
    primaryColor:   "#4a7c59",
    secondaryColor: "#c8a96e",
    accentColor:    "#f9f6f0",
    bgColor:        "#faf7f2",
    textColor:      "#2c2416",
    mutedColor:     "#7a6a58",
    cardColor:      "#ffffff",
    fontHeading:    "'DM Serif Display', Georgia, serif",
    fontBody:       "'DM Sans', system-ui, sans-serif",
    heroImage:      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80",
    features:       ["loyalty-points", "takeaway", "dine-in", "custom-drinks"],
    address:        "7 Banyan Lane, Bandra West, Mumbai 400050",
    phone:          "+91 98765 43210",
    hours:          "7:30 AM – 9:00 PM",
    categories: [
      { id:"coffee",   name:"Coffee",        icon:"☕" },
      { id:"cold",     name:"Cold Drinks",   icon:"🧊" },
      { id:"food",     name:"All Day Bites", icon:"🥐" },
      { id:"desserts", name:"Sweet Things",  icon:"🍰" }
    ],
    menu: [
      { id:"c1", cat:"coffee",   name:"Single Origin Pour Over", price:320, veg:true,  desc:"Ethiopia Yirgacheffe, bright floral notes, light roast",        img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75", popular:true  },
      { id:"c2", cat:"coffee",   name:"Oat Milk Flat White",     price:280, veg:true,  desc:"Double ristretto, steamed oat milk, silky microfoam",           img:"https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=75", popular:true  },
      { id:"c3", cat:"coffee",   name:"Classic Espresso",        price:180, veg:true,  desc:"House blend, rich crema, served with sparkling water",          img:"https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&q=75", popular:false },
      { id:"c4", cat:"cold",     name:"Cold Brew Float",         price:340, veg:true,  desc:"18-hour cold brew, vanilla bean ice cream, toffee drizzle",    img:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=75", popular:true  },
      { id:"c5", cat:"cold",     name:"Matcha Lemonade",         price:290, veg:true,  desc:"Ceremonial matcha, fresh lemon, honey syrup, soda",             img:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=75", popular:false },
      { id:"c6", cat:"food",     name:"Avocado Toast",           price:380, veg:true,  desc:"Sourdough, smashed avo, dukkah, cherry tomatoes, EVOO",         img:"https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=75", popular:true  },
      { id:"c7", cat:"food",     name:"Almond Croissant",        price:220, veg:true,  desc:"Twice-baked, almond frangipane, flaked almonds, icing sugar",   img:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=75", popular:false },
      { id:"c8", cat:"desserts", name:"Basque Cheesecake Slice", price:320, veg:true,  desc:"Burnt Basque, caramelised top, creamy centre, seasonal compote",img:"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=75", popular:true  }
    ],
    banners: [
      { title:"Morning Ritual", subtitle:"Free pastry with any coffee before 9 AM", cta:"Order Now",  bg:"#3d6b47" },
      { title:"Loyalty Rewards", subtitle:"Earn a free drink every 10 orders",      cta:"Join Now",   bg:"#7a5c3a" }
    ]
  },

  bakery: {
    tenantId:       "demo-bakery",
    businessName:   "Pâtisserie Rose",
    tagline:        "Baked with Love, Always",
    businessType:   "bakery",
    logo:           "🎂",
    logoText:       "Pâtisserie Rose",
    currency:       "₹",
    currencySymbol: "₹",
    primaryColor:   "#c17a7a",
    secondaryColor: "#8b5e3c",
    accentColor:    "#fff8f3",
    bgColor:        "#fff8f3",
    textColor:      "#3a2218",
    mutedColor:     "#9e7b6b",
    cardColor:      "#ffffff",
    fontHeading:    "'Cormorant Garamond', Georgia, serif",
    fontBody:       "'Nunito', system-ui, sans-serif",
    heroImage:      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1600&q=80",
    features:       ["custom-cakes", "pickup-schedule", "cake-message", "takeaway"],
    address:        "22 Rose Garden Road, Koregaon Park, Pune 411001",
    phone:          "+91 98234 56789",
    hours:          "8:00 AM – 8:00 PM",
    categories: [
      { id:"cakes",      name:"Signature Cakes", icon:"🎂" },
      { id:"pastries",   name:"French Pastries",  icon:"🥐" },
      { id:"cookies",    name:"Cookies & Bakes",  icon:"🍪" },
      { id:"bread",      name:"Artisan Breads",   icon:"🍞" }
    ],
    menu: [
      { id:"b1", cat:"cakes",    name:"Rose Lychee Gateau",      price:1200, veg:true, desc:"Layers of vanilla sponge, rose cream, fresh lychee, edible petals",  img:"https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=75", popular:true  },
      { id:"b2", cat:"cakes",    name:"Belgian Chocolate Torte", price:1400, veg:true, desc:"Dark 70% chocolate mousse, mirror glaze, gold leaf finish",           img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75", popular:true  },
      { id:"b3", cat:"cakes",    name:"Strawberry Fraisier",     price:980,  veg:true, desc:"Mousseline cream, fresh strawberries, classic French fraisier",       img:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=75", popular:false },
      { id:"b4", cat:"pastries", name:"Kouign-Amann",            price:240,  veg:true, desc:"Laminated butter dough, caramelised crust, Breton classic",           img:"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=75", popular:true  },
      { id:"b5", cat:"pastries", name:"Éclair au Café",          price:280,  veg:true, desc:"Choux pastry, coffee pastry cream, dark chocolate fondant",           img:"https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=75", popular:false },
      { id:"b6", cat:"cookies",  name:"Brown Butter Cookies",    price:160,  veg:true, desc:"Salted, nutty brown butter, dark chocolate chunks, sea salt",         img:"https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=75", popular:true  },
      { id:"b7", cat:"bread",    name:"Country Sourdough Loaf",  price:380,  veg:true, desc:"72-hour fermentation, open crumb, crisp crust, 800g",                 img:"https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=75", popular:false },
      { id:"b8", cat:"bread",    name:"Rosemary Focaccia",       price:280,  veg:true, desc:"Extra virgin olive oil, fresh rosemary, flaky sea salt, sundried tomato",img:"https://images.unsplash.com/photo-1601000938259-6dfb43a42cd7?w=400&q=75", popular:false }
    ],
    banners: [
      { title:"Custom Cake Orders",  subtitle:"Design your dream cake — 48hr advance booking", cta:"Order Custom", bg:"#c17a7a" },
      { title:"Morning Fresh Batch", subtitle:"Pastries ready by 8 AM daily",                  cta:"Pre-order",    bg:"#8b5e3c" }
    ]
  },

  sweets: {
    tenantId:       "demo-sweets",
    businessName:   "Mithas — The Sweet House",
    tagline:        "Tradition in Every Bite",
    businessType:   "sweets-shop",
    logo:           "🍬",
    logoText:       "Mithas",
    currency:       "₹",
    currencySymbol: "₹",
    primaryColor:   "#7a1c1c",
    secondaryColor: "#c9952a",
    accentColor:    "#fdf6e9",
    bgColor:        "#1a0a00",
    textColor:      "#fdf6e9",
    mutedColor:     "#c4a882",
    cardColor:      "#2a1400",
    fontHeading:    "'Yeseva One', Georgia, serif",
    fontBody:       "'Hind', system-ui, sans-serif",
    heroImage:      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    features:       ["gift-boxes", "weight-based", "festive-collections", "bulk-order"],
    address:        "108 Mithas Gali, Chandni Chowk, Delhi 110006",
    phone:          "+91 11 2345 6789",
    hours:          "9:00 AM – 10:00 PM",
    categories: [
      { id:"traditional", name:"Traditional Sweets", icon:"🍡" },
      { id:"premium",     name:"Premium Range",       icon:"✨" },
      { id:"giftbox",     name:"Gift Boxes",           icon:"🎁" },
      { id:"seasonal",    name:"Festive Special",      icon:"🪔" }
    ],
    menu: [
      { id:"s1", cat:"traditional", name:"Kesar Peda",          price:60,   veg:true, desc:"Pure saffron, fresh khoya, cardamom — per piece",             img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=75", popular:true,  unit:"per piece" },
      { id:"s2", cat:"traditional", name:"Motichoor Ladoo",      price:480,  veg:true, desc:"Fine boondi, pure ghee, saffron — 500g box",                  img:"https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=75", popular:true,  unit:"500g" },
      { id:"s3", cat:"traditional", name:"Kaju Katli",           price:960,  veg:true, desc:"Premium cashew, pure silver vark — 500g premium box",        img:"https://images.unsplash.com/photo-1635700875432-0e2c7a659d11?w=400&q=75", popular:true,  unit:"500g" },
      { id:"s4", cat:"premium",     name:"Pistachio Barfi",      price:1200, veg:true, desc:"Iranian pistachio, rose water, 24K gold leaf — 400g",         img:"https://images.unsplash.com/photo-1558618047-f8c6f0d6b0e8?w=400&q=75", popular:true,  unit:"400g" },
      { id:"s5", cat:"premium",     name:"Malai Gulkand Roll",   price:1400, veg:true, desc:"Fresh malai, gulkand, silver vark — 400g premium tin",        img:"https://images.unsplash.com/photo-1571167514822-25b5e2f5de8e?w=400&q=75", popular:false, unit:"400g" },
      { id:"s6", cat:"giftbox",     name:"Diwali Grand Box",     price:2500, veg:true, desc:"8 premium sweets, dry fruits, decorative box — 1kg",          img:"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=75", popular:true,  unit:"1kg box" },
      { id:"s7", cat:"giftbox",     name:"Wedding Favour Box",   price:380,  veg:true, desc:"5 assorted mithai, custom message card — per box",            img:"https://images.unsplash.com/photo-1559181567-c3190bfbf3ae?w=400&q=75", popular:false, unit:"per box" },
      { id:"s8", cat:"seasonal",    name:"Til Gur Laddoo",       price:360,  veg:true, desc:"Makar Sankranti special, sesame & jaggery — 400g",            img:"https://images.unsplash.com/photo-1630589976540-05b1e2024bce?w=400&q=75", popular:false, unit:"400g" }
    ],
    banners: [
      { title:"Diwali Collection 2026", subtitle:"Pre-order gift hampers — limited stock", cta:"Order Now",  bg:"#7a1c1c" },
      { title:"Bulk & Corporate Orders", subtitle:"Custom packaging, min 5kg order",      cta:"Enquire",    bg:"#3a2000" }
    ]
  },

  fastfood: {
    tenantId:       "demo-fastfood",
    businessName:   "BurgerBlast",
    tagline:        "Bold Flavours. No Waiting.",
    businessType:   "fast-food",
    logo:           "🍔",
    logoText:       "BurgerBlast",
    currency:       "₹",
    currencySymbol: "₹",
    primaryColor:   "#e05c1a",
    secondaryColor: "#2c2c2c",
    accentColor:    "#f8f8f8",
    bgColor:        "#111111",
    textColor:      "#f8f8f8",
    mutedColor:     "#999999",
    cardColor:      "#1e1e1e",
    fontHeading:    "'Barlow Condensed', Impact, sans-serif",
    fontBody:       "'Barlow', system-ui, sans-serif",
    heroImage:      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=80",
    features:       ["combos", "toppings", "quick-reorder", "takeaway", "delivery"],
    address:        "Cloud Kitchen, Andheri East, Mumbai 400069",
    phone:          "+91 98100 00001",
    hours:          "11:00 AM – 12:00 AM",
    categories: [
      { id:"burgers",  name:"Burgers",      icon:"🍔" },
      { id:"combos",   name:"Combos",       icon:"🍟" },
      { id:"sides",    name:"Sides",        icon:"🍕" },
      { id:"drinks",   name:"Drinks",       icon:"🥤" }
    ],
    menu: [
      { id:"f1", cat:"burgers", name:"Smash Double Patty",     price:349, veg:false, desc:"Two smashed beef patties, American cheese, pickles, special sauce", img:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=75", popular:true  },
      { id:"f2", cat:"burgers", name:"Crispy Chicken Tower",   price:299, veg:false, desc:"Buttermilk fried chicken, slaw, jalapeño mayo, brioche bun",        img:"https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=75", popular:true  },
      { id:"f3", cat:"burgers", name:"Veg BBQ Black Bean",     price:249, veg:true,  desc:"Black bean patty, grilled onions, smoky BBQ, cheddar",              img:"https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&q=75", popular:false },
      { id:"f4", cat:"combos",  name:"Blast Combo — Beef",    price:499, veg:false, desc:"Smash Double Patty + Loaded Fries + Large Coke",                    img:"https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=75", popular:true  },
      { id:"f5", cat:"combos",  name:"Blast Combo — Chicken", price:449, veg:false, desc:"Crispy Chicken Tower + Regular Fries + Large Pepsi",                img:"https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=75", popular:true  },
      { id:"f6", cat:"sides",   name:"Loaded Chilli Fries",   price:189, veg:true,  desc:"Crispy fries, chilli cheese sauce, jalapeños, spring onion",        img:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=75", popular:true  },
      { id:"f7", cat:"sides",   name:"Onion Rings Basket",    price:149, veg:true,  desc:"Beer-battered, crispy, served with ranch dip",                      img:"https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=75", popular:false },
      { id:"f8", cat:"drinks",  name:"Signature Thick Shake", price:199, veg:true,  desc:"Choose: Nutella | Oreo | Mango | Strawberry — 500ml",               img:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=75", popular:false }
    ],
    banners: [
      { title:"Order in 2 mins flat", subtitle:"Cloud kitchen — fastest delivery in the city", cta:"Order Now", bg:"#e05c1a" },
      { title:"Combo Saver Deals",   subtitle:"Save ₹100 on every combo meal today",           cta:"See Combos", bg:"#2c2c2c" }
    ]
  }
};

/* ─────────────────────────────────────────
   TENANT ENGINE
───────────────────────────────────────── */
const TenantEngine = (() => {

  let _config = null;

  /** Read URL params and return the active tenant config */
  function resolveConfig() {
    const params   = new URLSearchParams(window.location.search);
    const demoKey  = params.get("demo");
    const tenantId = params.get("restaurant");

    if (demoKey && DEMO_CONFIGS[demoKey]) {
      _config = { ...DEMO_CONFIGS[demoKey], _isDemo: true };
      return _config;
    }

    if (tenantId) {
      // Real tenant — load from Firebase (async, handled separately)
      _config = { tenantId, _isDemo: false, _loading: true };
      return _config;
    }

    // Default: show fine-dining demo
    _config = { ...DEMO_CONFIGS.restaurant, _isDemo: true };
    return _config;
  }

  /** Apply CSS variables for a tenant's theme */
  function applyTheme(cfg) {
    const root = document.documentElement;
    root.style.setProperty("--primary",   cfg.primaryColor);
    root.style.setProperty("--secondary", cfg.secondaryColor);
    root.style.setProperty("--accent",    cfg.accentColor);
    root.style.setProperty("--bg",        cfg.bgColor);
    root.style.setProperty("--text",      cfg.textColor);
    root.style.setProperty("--muted",     cfg.mutedColor);
    root.style.setProperty("--card",      cfg.cardColor);
    root.style.setProperty("--font-heading", cfg.fontHeading);
    root.style.setProperty("--font-body",    cfg.fontBody);
  }

  /** Load fonts for a tenant dynamically */
  function loadFonts(cfg) {
    const fontMap = {
      "'Playfair Display', Georgia, serif":    "Playfair+Display:wght@400;700;800",
      "'DM Serif Display', Georgia, serif":   "DM+Serif+Display:ital@0;1",
      "'Cormorant Garamond', Georgia, serif": "Cormorant+Garamond:wght@400;600;700",
      "'Yeseva One', Georgia, serif":          "Yeseva+One",
      "'Barlow Condensed', Impact, sans-serif":"Barlow+Condensed:wght@600;700;800",
      "'Lato', system-ui, sans-serif":         "Lato:wght@300;400;700",
      "'DM Sans', system-ui, sans-serif":      "DM+Sans:wght@400;500;600",
      "'Nunito', system-ui, sans-serif":       "Nunito:wght@400;600;700",
      "'Hind', system-ui, sans-serif":         "Hind:wght@400;500;600",
      "'Barlow', system-ui, sans-serif":       "Barlow:wght@400;500;600"
    };
    const families = [
      fontMap[cfg.fontHeading],
      fontMap[cfg.fontBody]
    ].filter(Boolean).join("&family=");

    if (families) {
      const link = document.createElement("link");
      link.rel  = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
      document.head.appendChild(link);
    }
  }

  /** Get tenant-scoped Firebase DB path */
  function dbPath(segment) {
    if (!_config || !_config.tenantId) throw new Error("No tenant loaded");
    return `tenants/${_config.tenantId}/${segment}`;
  }

  /** Get current config */
  function getConfig() { return _config; }

  /** Initialize — resolves, themes and loads fonts */
  function init() {
    const cfg = resolveConfig();
    applyTheme(cfg);
    loadFonts(cfg);
    return cfg;
  }

  return { init, resolveConfig, applyTheme, loadFonts, dbPath, getConfig, DEMO_CONFIGS };
})();

window.TenantEngine = TenantEngine;
