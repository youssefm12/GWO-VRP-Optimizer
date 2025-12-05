# 📦 Project Dependencies

## Complete Dependency List

This document lists all required dependencies for the VRP Optimizer application.

### Core Framework
```json
"react": "^18.3.1",
"react-dom": "^18.3.1"
```

### TypeScript
```json
"typescript": "^5.6.2",
"@types/react": "^18.3.0",
"@types/react-dom": "^18.3.0"
```

### Build Tools
```json
"vite": "^6.0.0",
"@vitejs/plugin-react": "^4.3.0"
```

### Styling
```json
"tailwindcss": "^4.0.0",
"autoprefixer": "^10.4.0",
"postcss": "^8.4.0"
```

### Map Visualization
```json
"leaflet": "^1.9.4",
"react-leaflet": "^4.2.1",
"@types/leaflet": "^1.9.0"
```
**Purpose**: Interactive map visualization with custom markers and route polylines.

### Charts
```json
"recharts": "^2.15.0"
```
**Purpose**: Convergence charts and comparison bar charts.

### Animation
```json
"motion": "^12.0.0"
```
**Purpose**: Smooth transitions, page animations, and UI effects (previously Framer Motion).

### Icons
```json
"lucide-react": "^0.462.0"
```
**Purpose**: Beautiful, consistent icon set for UI elements.

### UI Components (shadcn/ui dependencies)
```json
"class-variance-authority": "^0.7.0",
"clsx": "^2.1.0",
"tailwind-merge": "^2.5.0",
"@radix-ui/react-slot": "^1.1.0",
"@radix-ui/react-label": "^2.1.0",
"@radix-ui/react-slider": "^1.2.0",
"@radix-ui/react-switch": "^1.1.0",
"@radix-ui/react-separator": "^1.1.0"
```

## Installation Commands

### All at Once
```bash
npm install leaflet react-leaflet recharts motion lucide-react @types/leaflet
```

### Individual Packages

#### Maps
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

#### Charts
```bash
npm install recharts
```

#### Animation
```bash
npm install motion
```

#### Icons
```bash
npm install lucide-react
```

## Import Examples

### Leaflet
```typescript
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
```

### Recharts
```typescript
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
```

### Motion
```typescript
import { motion, AnimatePresence } from 'motion/react';
```

### Lucide Icons
```typescript
import { Play, Pause, RefreshCw, Truck, TrendingDown } from 'lucide-react';
```

## Package Sizes (Approximate)

| Package | Size (Minified + Gzipped) | Purpose |
|---------|---------------------------|---------|
| leaflet | ~145 KB | Map rendering |
| react-leaflet | ~8 KB | React wrapper for Leaflet |
| recharts | ~95 KB | Chart components |
| motion | ~37 KB | Animation library |
| lucide-react | ~2 KB per icon | Icon components |

**Total Additional Size**: ~290 KB (gzipped)

## Browser Compatibility

All dependencies support:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Version Pinning

To ensure reproducible builds, consider pinning exact versions:

```json
{
  "dependencies": {
    "leaflet": "1.9.4",
    "react-leaflet": "4.2.1",
    "recharts": "2.15.0",
    "motion": "12.0.0",
    "lucide-react": "0.462.0"
  }
}
```

## CDN Alternatives (Not Recommended)

While you can load some libraries via CDN, it's recommended to use npm for better TypeScript support and bundling optimization:

```html
<!-- Leaflet CSS (if not using npm) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

## Updating Dependencies

To update all dependencies to their latest compatible versions:

```bash
npm update
```

To update to the latest major versions (potentially breaking):

```bash
npm install leaflet@latest react-leaflet@latest recharts@latest motion@latest lucide-react@latest
```

## Troubleshooting

### Peer Dependency Warnings

If you see peer dependency warnings, try:

```bash
npm install --legacy-peer-deps
```

### Conflicting Versions

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Missing Types

Install missing type definitions:

```bash
npm install -D @types/node
```

## Development vs Production

### Development Only
```json
"devDependencies": {
  "@types/leaflet": "^1.9.0",
  "@types/node": "^20.0.0",
  "vite": "^6.0.0"
}
```

### Production
All other dependencies are needed in production and should be in `"dependencies"`.

## Security Considerations

- ✅ All packages are from trusted sources (npm registry)
- ✅ Regular security audits: `npm audit`
- ✅ Update packages for security patches
- ⚠️ Leaflet loads map tiles from external sources (OpenStreetMap)

## License Information

- **Leaflet**: BSD-2-Clause
- **Recharts**: MIT
- **Motion**: MIT
- **Lucide**: ISC
- **React**: MIT

All dependencies use permissive licenses compatible with commercial use.

## Alternative Libraries

If you need to substitute:

| Current | Alternative |
|---------|-------------|
| Leaflet | Mapbox GL JS, Google Maps API |
| Recharts | Chart.js, Victory, Plotly.js |
| Motion | React Spring, GSAP |
| Lucide | Heroicons, Feather Icons, Font Awesome |

---

Last Updated: December 2024
