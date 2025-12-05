# 📁 Project Structure

Comprehensive guide to the VRP Optimizer codebase organization.

## Directory Tree

```
vrp-optimizer/
├── public/                          # Static assets
├── src/
│   ├── components/                  # React components
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx          # Button component
│   │   │   ├── card.tsx            # Card container
│   │   │   ├── slider.tsx          # Range slider
│   │   │   ├── input.tsx           # Text input
│   │   │   ├── label.tsx           # Form label
│   │   │   ├── switch.tsx          # Toggle switch
│   │   │   ├── separator.tsx       # Visual divider
│   │   │   └── ...                 # Other UI components
│   │   │
│   │   ├── Charts/                  # Chart components
│   │   │   ├── ConvergenceChart.tsx # Iteration vs fitness
│   │   │   └── ComparisonChart.tsx  # Baseline vs GWO
│   │   │
│   │   ├── MapView.tsx              # Main map component
│   │   ├── ControlPanel.tsx         # Parameter controls
│   │   ├── StatsPanel.tsx           # Metrics display
│   │   └── RoutesAnimation.tsx      # Delivery animation
│   │
│   ├── api/                         # API integration
│   │   ├── wsClient.ts             # WebSocket utilities
│   │   └── httpClient.ts           # HTTP client
│   │
│   ├── utils/                       # Utility functions
│   │   ├── colors.ts               # Route color management
│   │   ├── mockData.ts             # Mock data generator
│   │   ├── animationHelpers.ts     # Animation utilities
│   │   └── decodeHelpers.ts        # Data processing
│   │
│   ├── styles/                      # Stylesheets
│   │   └── globals.css             # Global styles + animations
│   │
│   ├── App.tsx                      # Main application
│   └── main.tsx                     # Entry point
│
├── .env.example                     # Environment variables template
├── index.html                       # HTML entry point
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
├── README.md                        # Main documentation
├── QUICK_START.md                   # Quick start guide
├── INSTALLATION.md                  # Installation guide
├── DEPENDENCIES.md                  # Dependency details
├── BACKEND_INTEGRATION.md           # Backend setup
├── API_EXAMPLES.md                  # API examples
└── PROJECT_STRUCTURE.md             # This file
```

## Component Breakdown

### 🗺️ MapView.tsx
**Location**: `/src/components/MapView.tsx`  
**Lines**: ~240  
**Purpose**: Interactive Leaflet map with custom markers and routes

**Key Features**:
- Custom depot icon (warehouse)
- Numbered customer markers
- Color-coded route polylines
- Dynamic map legend
- Auto-fit bounds
- Popup information

**Dependencies**:
- react-leaflet
- leaflet
- /utils/colors.ts

**Props**:
```typescript
interface MapViewProps {
  depot: { lat: number; lng: number };
  customers: Customer[];
  routes?: number[][];
  showGWORoutes?: boolean;
}
```

---

### 🎛️ ControlPanel.tsx
**Location**: `/src/components/ControlPanel.tsx`  
**Lines**: ~200  
**Purpose**: Left sidebar with all optimization parameters and controls

**Sections**:
1. **Algorithm Parameters**
   - Number of wolves (slider + input)
   - Iterations (slider + input)
   - Random seed (input)

2. **VRP Configuration**
   - Vehicle capacity (slider + input)
   - Penalty coefficient (slider + input)
   - Number of customers (slider + input)

3. **Action Buttons**
   - Regenerate VRP Instance
   - Run Optimization (Sync)
   - Run Optimization (WebSocket)

4. **Display Options**
   - Toggle GWO/Baseline routes

**Dependencies**:
- shadcn/ui components
- lucide-react icons

---

### 📊 StatsPanel.tsx
**Location**: `/src/components/StatsPanel.tsx`  
**Lines**: ~120  
**Purpose**: Display performance metrics and optimization summary

**Metrics**:
- Baseline distance
- GWO optimized distance
- % Improvement
- Number of vehicles
- Runtime

**Features**:
- Loading state indicator
- Color-coded metrics
- Optimization summary card
- Animated appearance

**Dependencies**:
- shadcn/ui Card
- lucide-react icons
- motion/react

---

### 📈 ConvergenceChart.tsx
**Location**: `/src/components/Charts/ConvergenceChart.tsx`  
**Lines**: ~70  
**Purpose**: Line chart showing fitness improvement over iterations

**Chart Type**: Line Chart (Recharts)  
**Data**: `{ iteration: number; fitness: number }[]`

**Features**:
- Real-time updates
- Responsive container
- Custom styling
- Tooltips

---

### 📊 ComparisonChart.tsx
**Location**: `/src/components/Charts/ComparisonChart.tsx`  
**Lines**: ~80  
**Purpose**: Bar chart comparing baseline vs GWO performance

**Chart Type**: Bar Chart (Recharts)  
**Data**: Baseline fitness vs GWO fitness

**Features**:
- Color-coded bars
- Improvement calculation
- Distance saved display

---

### 🚚 RoutesAnimation.tsx
**Location**: `/src/components/RoutesAnimation.tsx`  
**Lines**: ~300  
**Purpose**: Animated delivery simulation with truck movement

**Features**:
- Truck icon animation
- Customer state change (blue → green)
- Progress tracking
- Play/Pause/Reset controls
- Linear interpolation for smooth movement

**State Management**:
- Current route index
- Current step index
- Delivered customers set
- Truck position

**Animation**:
- Uses `requestAnimationFrame`
- 2-second segments
- Smooth transitions

---

## Utility Files

### 🎨 colors.ts
**Location**: `/src/utils/colors.ts`  
**Lines**: ~45  
**Purpose**: Consistent color management for routes

**Functions**:
```typescript
getRouteColor(index: number): string
generateRandomColor(): string
hexToRGBA(hex: string, opacity: number): string
```

**Color Palette**: 15 predefined colors

---

### 📦 mockData.ts
**Location**: `/src/utils/mockData.ts`  
**Lines**: ~110  
**Purpose**: Generate mock VRP data for testing

**Functions**:
```typescript
generateMockVRPData(numCustomers: number): VRPData
calculateDistance(lat1, lng1, lat2, lng2): number
calculateRouteDistance(route, depot, customers): number
```

**Features**:
- Random coordinate generation
- Haversine distance calculation
- Configurable radius
- Realistic demand values

---

### 🎬 animationHelpers.ts
**Location**: `/src/utils/animationHelpers.ts`  
**Lines**: ~100  
**Purpose**: Animation utility functions

**Functions**:
```typescript
lerp(start, end, t): number
easeInOutCubic(t): number
interpolateCoordinates(start, end, t): Coordinates
calculateAnimationDuration(numStops): number
animationLoop(callback, duration): CleanupFunction
```

---

### 🔄 decodeHelpers.ts
**Location**: `/src/utils/decodeHelpers.ts`  
**Lines**: ~140  
**Purpose**: Data processing and validation

**Functions**:
```typescript
decodeRouteToCoordinates(route, depot, customers): Coordinates[]
calculateRouteDemand(route, customers): number
isRouteValid(route, customers, capacity): boolean
getRouteStats(route, customers): RouteStats
formatConvergenceData(rawData): ChartData[]
parseBackendRoutes(backendRoutes): number[][]
calculateRoutesSummary(routes, customers): Summary
```

---

## API Integration

### 🌐 wsClient.ts
**Location**: `/src/api/wsClient.ts`  
**Lines**: ~75  
**Purpose**: WebSocket client for real-time optimization

**Functions**:
```typescript
createOptimizationWebSocket(config): WebSocket
sendOptimizationRequest(ws, payload): void
closeWebSocket(ws): void
```

**Message Types**:
```typescript
interface WSOptimizationMessage {
  iter?: number;
  best_fitness?: number;
  done?: boolean;
  routes?: number[][];
  runtime?: number;
}
```

---

### 📡 httpClient.ts
**Location**: `/src/api/httpClient.ts`  
**Lines**: ~95  
**Purpose**: HTTP client for synchronous optimization

**Functions**:
```typescript
runSyncOptimization(url, request): Promise<OptimizationResponse>
regenerateVRPInstance(url, numCustomers): Promise<VRPData>
checkAPIHealth(url): Promise<boolean>
```

---

## Main Application

### 🏠 App.tsx
**Location**: `/src/App.tsx`  
**Lines**: ~280  
**Purpose**: Main application component and state management

**State Management**:
```typescript
const [config, setConfig] = useState<VRPConfig>()
const [vrpData, setVrpData] = useState<VRPData>()
const [baselineResult, setBaselineResult] = useState<OptimizationResult>()
const [gwoResult, setGwoResult] = useState<OptimizationResult>()
const [showGWORoutes, setShowGWORoutes] = useState<boolean>()
const [isOptimizing, setIsOptimizing] = useState<boolean>()
const [optimizationProgress, setOptimizationProgress] = useState<[]>()
const [isAnimating, setIsAnimating] = useState<boolean>()
```

**Key Functions**:
- `handleRegenerateData()` - Generate new VRP instance
- `handleConfigChange()` - Update configuration
- `handleOptimizeSync()` - Run synchronous optimization
- `handleOptimizeRealtime()` - Run WebSocket optimization

**Layout**:
```
┌─────────────┬────────────────┬──────────────┐
│ Control     │      Map       │  Stats       │
│ Panel       │   (Leaflet)    │  & Charts    │
│ (Left)      │   (Center)     │  (Right)     │
└─────────────┴────────────────┴──────────────┘
```

---

### 🚀 main.tsx
**Location**: `/src/main.tsx`  
**Lines**: ~10  
**Purpose**: Application entry point

**Responsibilities**:
- Mount React root
- Import global styles
- Import Leaflet CSS
- Wrap with StrictMode

---

## Styling

### 🎨 globals.css
**Location**: `/src/styles/globals.css`  
**Lines**: ~250  
**Purpose**: Global styles, CSS variables, animations

**Sections**:
1. **CSS Variables** - Design tokens
2. **Dark Mode** - Dark theme variables
3. **Base Styles** - Typography, resets
4. **Custom Animations** - Pulse, transitions
5. **Scrollbar Styling** - Custom scrollbars
6. **Leaflet Overrides** - Map styling

**Key Animations**:
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

---

## Configuration Files

### 📦 package.json
**Purpose**: NPM package configuration
**Key Scripts**:
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

### ⚙️ tsconfig.json
**Purpose**: TypeScript compiler configuration
**Key Settings**:
- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Strict mode enabled

### 🎨 tailwind.config.js
**Purpose**: Tailwind CSS configuration
**Key Settings**:
- Custom colors from CSS variables
- Border radius tokens
- Theme extensions

### ⚡ vite.config.ts
**Purpose**: Vite build tool configuration
**Plugins**:
- @vitejs/plugin-react

---

## Documentation Files

| File | Purpose | Lines |
|------|---------|-------|
| README.md | Main documentation | ~350 |
| QUICK_START.md | Quick start guide | ~220 |
| INSTALLATION.md | Installation instructions | ~180 |
| DEPENDENCIES.md | Dependency details | ~200 |
| BACKEND_INTEGRATION.md | Backend setup guide | ~500 |
| API_EXAMPLES.md | API examples | ~400 |
| PROJECT_STRUCTURE.md | This file | ~500 |

---

## Code Statistics

### Component Lines of Code

| Component | Lines | Complexity |
|-----------|-------|------------|
| MapView | 240 | Medium |
| ControlPanel | 200 | Low |
| StatsPanel | 120 | Low |
| RoutesAnimation | 300 | High |
| ConvergenceChart | 70 | Low |
| ComparisonChart | 80 | Low |
| App | 280 | High |

**Total Frontend Code**: ~1,500 lines

### Utility Lines of Code

| Utility | Lines | Functions |
|---------|-------|-----------|
| colors.ts | 45 | 3 |
| mockData.ts | 110 | 3 |
| animationHelpers.ts | 100 | 6 |
| decodeHelpers.ts | 140 | 7 |
| wsClient.ts | 75 | 3 |
| httpClient.ts | 95 | 3 |

**Total Utility Code**: ~565 lines

---

## Import Graph

```
main.tsx
  └── App.tsx
      ├── MapView.tsx
      │   ├── react-leaflet
      │   ├── leaflet
      │   └── utils/colors.ts
      │
      ├── ControlPanel.tsx
      │   ├── ui/button.tsx
      │   ├── ui/slider.tsx
      │   ├── ui/input.tsx
      │   ├── ui/label.tsx
      │   ├── ui/switch.tsx
      │   └── lucide-react
      │
      ├── StatsPanel.tsx
      │   ├── ui/card.tsx
      │   ├── lucide-react
      │   └── motion/react
      │
      ├── RoutesAnimation.tsx
      │   ├── ui/button.tsx
      │   ├── lucide-react
      │   ├── motion/react
      │   ├── react-leaflet
      │   └── utils/colors.ts
      │
      ├── Charts/ConvergenceChart.tsx
      │   ├── recharts
      │   └── ui/card.tsx
      │
      ├── Charts/ComparisonChart.tsx
      │   ├── recharts
      │   └── ui/card.tsx
      │
      ├── utils/mockData.ts
      └── api/wsClient.ts
```

---

## File Size Breakdown

| Category | Files | Size (KB) |
|----------|-------|-----------|
| Components | 8 | ~85 |
| Utilities | 6 | ~30 |
| API | 2 | ~10 |
| Styles | 1 | ~8 |
| UI Components | 45+ | ~150 |
| Documentation | 7 | ~100 |

**Total Project Size**: ~380 KB (source code)

---

## Development Workflow

1. **Edit Code** → Component files
2. **Vite HMR** → Instant reload
3. **Test** → Browser
4. **Build** → `npm run build`
5. **Deploy** → `dist/` folder

---

## Testing Structure (Recommended)

```
tests/
├── unit/
│   ├── colors.test.ts
│   ├── mockData.test.ts
│   └── decodeHelpers.test.ts
├── integration/
│   ├── optimization.test.ts
│   └── websocket.test.ts
└── e2e/
    ├── userFlow.test.ts
    └── animation.test.ts
```

---

This structure provides a clean, scalable, and maintainable codebase for the VRP Optimizer! 🚀
