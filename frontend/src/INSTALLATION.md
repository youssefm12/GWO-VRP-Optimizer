# 📦 Installation Guide

## Quick Start

### 1. Install Dependencies

The application requires the following npm packages:

```bash
npm install leaflet react-leaflet recharts motion lucide-react
```

### 2. Install Type Definitions

For TypeScript support:

```bash
npm install -D @types/leaflet
```

### 3. Verify Installation

Check that these packages are in your `package.json`:

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.15.0",
    "motion": "^12.0.0",
    "lucide-react": "^0.462.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.0"
  }
}
```

## Complete Package List

### Core Dependencies (Already Included)
- ✅ `react` - React framework
- ✅ `react-dom` - React DOM renderer
- ✅ `typescript` - TypeScript support
- ✅ `tailwindcss` - Utility-first CSS
- ✅ All shadcn/ui components

### Required New Dependencies
- 📦 `leaflet` - Map library
- 📦 `react-leaflet` - React wrapper for Leaflet
- 📦 `recharts` - Charting library
- 📦 `motion` - Animation library (Framer Motion)
- 📦 `lucide-react` - Icon library

### Type Definitions
- 📦 `@types/leaflet` - TypeScript definitions for Leaflet

## Troubleshooting

### Leaflet Icons Not Showing

If you see broken image icons, ensure Leaflet CSS is loaded. The MapView component handles this automatically, but you can also add it to your `index.html`:

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  crossorigin=""
/>
```

### Module Resolution Errors

If you encounter import errors:

1. Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Clear Vite cache:
```bash
rm -rf .vite
npm run dev
```

### TypeScript Errors

If TypeScript complains about missing types:

```bash
npm install -D @types/node @types/react @types/react-dom
```

### Map Tiles Not Loading

If map tiles don't load:
- Check your internet connection
- Ensure no firewall blocking OpenStreetMap
- Check browser console for CORS errors

## Development Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd vrp-optimizer
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your backend URLs
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview  # Preview production build
```

## Backend Setup (Optional)

If you want to connect to a real backend:

### Python FastAPI Backend Example

```python
# backend/main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/optimize")
async def websocket_optimize(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_json()
    
    # Run optimization and send progress
    for i in range(100):
        await asyncio.sleep(0.05)
        await websocket.send_json({
            "iter": i,
            "best_fitness": 1000 - i * 5
        })
    
    # Send final result
    await websocket.send_json({
        "done": True,
        "routes": [[0, 1, 2, 0], [0, 3, 4, 0]],
        "best_fitness": 500,
        "runtime": 5.0
    })
    
    await websocket.close()

@app.post("/optimize_sync")
async def optimize_sync(request: dict):
    # Implement your GWO algorithm here
    return {
        "routes": [[0, 1, 2, 0], [0, 3, 4, 0]],
        "best_fitness": 500,
        "convergence_history": [...],
        "runtime": 5.0
    }
```

### Run Backend
```bash
pip install fastapi uvicorn websockets
uvicorn main:app --reload --port 8000
```

## Docker Setup (Optional)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host"]
```

### Build and Run
```bash
docker build -t vrp-optimizer .
docker run -p 5173:5173 vrp-optimizer
```

## System Requirements

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher (or yarn/pnpm equivalent)
- **Browser**: Modern browser with ES6+ support
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

## Performance Optimization

### For Large Datasets (50+ customers)

1. Increase animation duration:
```typescript
// components/RoutesAnimation.tsx
const duration = 3000; // Slower animation
```

2. Reduce convergence plot frequency:
```typescript
// App.tsx
if (i % 10 === 0) {  // Update every 10 iterations
  convergence.push({ iteration: i, fitness: bestFitness });
}
```

3. Enable production mode:
```bash
npm run build
npm run preview
```

## Getting Help

- 📚 Check the [README.md](./README.md) for usage guide
- 🐛 Report issues on GitHub
- 💬 Join our community discussions

---

Happy Optimizing! 🚚✨
