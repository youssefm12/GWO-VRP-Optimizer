# ⚡ Quick Start Guide

Get your VRP Optimizer up and running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- npm, yarn, or pnpm
- Modern web browser

## Step 1: Install Dependencies

```bash
npm install leaflet react-leaflet recharts motion lucide-react @types/leaflet
```

Or all at once:
```bash
npm install
```

## Step 2: Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Step 3: Use the Application

### Without Backend (Mock Data Mode)

The app works immediately with built-in mock data:

1. **Configure Parameters** (left sidebar)
   - Adjust wolves, iterations, etc.

2. **Generate Problem**
   - Click "Regenerate VRP Instance"
   - 20 customers will be placed on the map

3. **Run Optimization**
   - Click "Run Optimization (Sync)"
   - Watch the progress

4. **View Results**
   - Routes appear on map
   - Charts show in right sidebar
   - Stats update automatically

5. **Animate Delivery**
   - Click "Play" in animation panel
   - Watch trucks deliver to customers

### With Backend

1. **Start your backend server** (see BACKEND_INTEGRATION.md)

2. **Update WebSocket URL** in `/App.tsx`:
```typescript
const wsUrl = 'ws://localhost:8000/ws/optimize';
```

3. **Run Real-time Optimization**
   - Click "Run Optimization (WebSocket)"
   - See live convergence updates

## What You'll See

```
┌─────────────────┬──────────────────────────────┬─────────────────┐
│                 │                              │                 │
│  Control Panel  │      Interactive Map         │  Stats & Charts │
│                 │                              │                 │
│  - Parameters   │  🏭 Depot                    │  📊 Metrics     │
│  - Sliders      │  📍 Customers (20)           │  📈 Charts      │
│  - Buttons      │  🚚 Routes (colored)         │  💯 Results     │
│  - Toggles      │  🗺️ Legend                   │                 │
│                 │                              │                 │
│                 │  [Animation Panel]           │                 │
│                 │  ▶ Play │ ⏸ Pause │ 🔄      │                 │
└─────────────────┴──────────────────────────────┴─────────────────┘
```

## Common Tasks

### Change Number of Customers
1. Adjust "Number of Customers" slider (5-50)
2. Click "Regenerate VRP Instance"

### Compare Algorithms
1. Run optimization
2. Toggle "Show GWO Routes" switch
3. See baseline vs optimized routes

### Adjust Animation Speed
Edit `/components/RoutesAnimation.tsx`:
```typescript
const duration = 2000; // milliseconds per segment
```

### Change Map Location
Edit `/utils/mockData.ts`:
```typescript
const centerLat = 37.7749;  // Your latitude
const centerLng = -122.4194; // Your longitude
```

## Keyboard Shortcuts

- `Ctrl + R` - Regenerate VRP instance
- `Space` - Play/Pause animation (when focused)

## Troubleshooting

### Map tiles not loading?
- Check internet connection
- Wait a few seconds for tiles to load

### Blank screen?
- Check browser console (F12)
- Ensure all dependencies are installed

### Routes not showing?
- Click "Run Optimization" first
- Toggle "Show GWO Routes" switch

### Animation not working?
- Run optimization first
- Click the "Play" button

## Next Steps

- 📖 Read the full [README.md](./README.md)
- 🔌 Connect to backend: [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)
- 📦 Learn about dependencies: [DEPENDENCIES.md](./DEPENDENCIES.md)

## Example Workflow

```bash
# 1. Install
npm install

# 2. Start
npm run dev

# 3. In the browser:
#    - Click "Regenerate VRP Instance"
#    - Click "Run Optimization (Sync)"
#    - Click "Play" for animation
#    - Toggle routes to compare

# 4. Build for production
npm run build
npm run preview
```

## Default Configuration

```typescript
{
  numWolves: 30,
  numIterations: 100,
  randomSeed: 42,
  vehicleCapacity: 100,
  penaltyCoefficient: 1000,
  numCustomers: 20
}
```

## Mock Data Features

✅ Random customer generation  
✅ Realistic coordinates (San Francisco area)  
✅ Random demand (10-40 units)  
✅ Simulated convergence  
✅ Capacity-respecting routes  
✅ Baseline comparison  

## Tips for Best Experience

1. **Start Small**: Begin with 10-20 customers
2. **Watch Animation**: It's the coolest feature!
3. **Compare Routes**: Toggle between baseline and GWO
4. **Adjust Parameters**: See how they affect results
5. **Use WebSocket**: For the real-time experience

## Performance Tips

| Customers | Recommended Iterations | Expected Runtime |
|-----------|------------------------|------------------|
| 5-10      | 50-100                 | < 2s             |
| 10-20     | 100-200                | 2-5s             |
| 20-30     | 200-300                | 5-10s            |
| 30-50     | 300-500                | 10-20s           |

## Browser Support

| Browser | Minimum Version | Recommended |
|---------|----------------|-------------|
| Chrome  | 90+            | Latest      |
| Firefox | 88+            | Latest      |
| Safari  | 14+            | Latest      |
| Edge    | 90+            | Latest      |

## Getting Help

- 🐛 **Bug?** Check browser console
- ❓ **Question?** Read the docs
- 💬 **Stuck?** Open an issue

## Common Issues

### "Module not found: leaflet"
```bash
npm install leaflet react-leaflet @types/leaflet
```

### "Cannot read property 'map' of undefined"
- Run optimization first
- Check console for errors

### Animation stuttering
- Reduce customer count
- Close other browser tabs
- Increase animation duration

## Production Build

```bash
npm run build
npm run preview  # Test production build
```

Deploy the `dist` folder to your hosting service.

---

**🎉 Congratulations! You're now ready to optimize routes!**

Start with the mock data, then connect your backend for real optimization. Happy routing! 🚚
