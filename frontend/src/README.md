# 🚚 Vehicle Routing Problem Optimizer (VRP) - Grey Wolf Optimizer (GWO)

A modern, professional frontend application for solving the Vehicle Routing Problem using the Grey Wolf Optimizer metaheuristic algorithm. Built with React, TypeScript, TailwindCSS, and powered by real-time WebSocket communication.

![VRP Optimizer](https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800)

## ✨ Features

### 🗺️ Interactive Map Visualization
- **Leaflet Integration**: Interactive map with zoom, pan, and popup support
- **Custom Markers**: 
  - Depot shown as a warehouse icon (red)
  - Customers displayed as numbered markers (blue)
  - Delivered customers turn green during animation
- **Route Visualization**: Color-coded polylines for each vehicle route
- **Toggle Views**: Switch between baseline (Nearest Neighbor) and GWO optimized routes
- **Map Legend**: Dynamic legend showing all routes and marker types

### 🎛️ Control Panel
- **GWO Parameters**:
  - Number of wolves (population): 10-100
  - Iterations: 50-500
  - Random seed for reproducibility
- **VRP Configuration**:
  - Vehicle capacity: 50-200 units
  - Penalty coefficient: 100-5000
  - Number of customers: 5-50
- **Action Buttons**:
  - Regenerate VRP Instance
  - Run Optimization (Sync)
  - Run Optimization (WebSocket - Real-time)
- **Display Options**: Toggle between baseline and GWO routes

### 📊 Real-time Analytics Dashboard
- **Convergence Chart**: Live updates showing fitness improvement over iterations
- **Comparison Chart**: Bar chart comparing baseline vs GWO performance
- **Performance Metrics**:
  - Baseline distance
  - GWO optimized distance
  - % Improvement
  - Number of vehicles used
  - Runtime estimation

### 🎬 Animated Delivery Simulation
- **Truck Animation**: Watch trucks move along optimized routes
- **Visual Feedback**: Customers change from blue to green when delivered
- **Progress Tracking**: Real-time progress bar and statistics
- **Controls**: Play, Pause, and Reset functionality
- **Smooth Interpolation**: Linear interpolation for smooth truck movement

### 🔌 WebSocket Integration
- Real-time optimization progress updates
- Convergence chart updates on every iteration
- Fallback to synchronous optimization if WebSocket fails
- Connection status monitoring

### 🎨 Modern UI/UX
- **Motion Animations**: Smooth transitions using Framer Motion
- **Responsive Design**: Works on desktop and tablet screens
- **Split Layout**: 
  - Left: Control Panel
  - Center: Interactive Map
  - Right: Analytics Dashboard
- **Loading States**: Visual feedback during optimization
- **Custom Scrollbars**: Elegant scrollbar styling
- **Gradient Buttons**: Beautiful gradient effects

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn/ui
- **Maps**: React Leaflet + Leaflet
- **Charts**: Recharts
- **Animations**: Framer Motion (motion/react)
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **WebSocket**: Native WebSocket API

## 📁 Project Structure

```
src/
├── components/
│   ├── MapView.tsx                 # Interactive Leaflet map
│   ├── ControlPanel.tsx            # Left sidebar with controls
│   ├── StatsPanel.tsx              # Performance metrics display
│   ├── RoutesAnimation.tsx         # Animated delivery simulation
│   ├── Charts/
│   │   ├── ConvergenceChart.tsx    # Iteration vs fitness chart
│   │   └── ComparisonChart.tsx     # Baseline vs GWO comparison
│   └── ui/                         # shadcn/ui components
├── api/
│   ├── wsClient.ts                 # WebSocket client utilities
│   └── httpClient.ts               # HTTP API client
├── utils/
│   ├── colors.ts                   # Route color management
│   ├── mockData.ts                 # Mock data generation
│   ├── animationHelpers.ts         # Animation utilities
│   └── decodeHelpers.ts            # Data decoding utilities
├── styles/
│   └── globals.css                 # Global styles + animations
├── App.tsx                         # Main application component
└── main.tsx                        # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vrp-optimizer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## 🔗 Backend Integration

### API Endpoints

The application expects the following backend endpoints:

#### 1. Synchronous Optimization
```
POST http://localhost:8000/optimize_sync
Content-Type: application/json

Request Body:
{
  "config": {
    "numWolves": 30,
    "numIterations": 100,
    "randomSeed": 42,
    "vehicleCapacity": 100,
    "penaltyCoefficient": 1000
  },
  "vrpData": {
    "depot": { "lat": 37.7749, "lng": -122.4194 },
    "customers": [
      { "id": 1, "lat": 37.7849, "lng": -122.4094, "demand": 20 },
      ...
    ]
  }
}

Response:
{
  "routes": [[0, 3, 5, 0], [0, 1, 2, 6, 0]],
  "best_fitness": 210.33,
  "convergence_history": [
    { "iteration": 0, "fitness": 300.5 },
    { "iteration": 1, "fitness": 285.2 },
    ...
  ],
  "runtime": 2.5
}
```

#### 2. Real-time WebSocket Optimization
```
WebSocket: ws://localhost:8000/ws/optimize

Client sends:
{
  "config": { ... },
  "vrpData": { ... }
}

Server sends (iteratively):
{
  "iter": 5,
  "best_fitness": 231.5
}

Server sends (final):
{
  "done": true,
  "routes": [[0, 3, 5, 0], [0, 1, 2, 6, 0]],
  "best_fitness": 210.33,
  "runtime": 2.5
}
```

#### 3. Regenerate VRP Instance (Optional)
```
POST http://localhost:8000/generate_instance
Content-Type: application/json

Request Body:
{
  "num_customers": 20
}

Response:
{
  "depot": { "lat": 37.7749, "lng": -122.4194 },
  "customers": [...]
}
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/optimize
```

Update the API URLs in your code:
- `/api/httpClient.ts` - Update HTTP endpoints
- `/App.tsx` - Update WebSocket URL

## 🎯 Usage Guide

### Basic Workflow

1. **Configure Parameters**: Adjust GWO and VRP parameters in the left sidebar
2. **Generate Data**: Click "Regenerate VRP Instance" to create new customer locations
3. **Run Optimization**: 
   - Click "Run Optimization (Sync)" for immediate results
   - Click "Run Optimization (WebSocket)" for real-time progress updates
4. **View Results**: 
   - Routes appear on the map with color-coded lines
   - Metrics update in the right sidebar
   - Charts show convergence and comparison data
5. **Animate Delivery**: Click "Play" in the animation panel to watch the delivery simulation
6. **Toggle Views**: Use the switch to compare baseline vs GWO routes

### Mock Data Mode

The application includes a complete mock data system that works without a backend:
- Generates random customer locations around San Francisco
- Simulates optimization with realistic convergence
- Creates mock routes respecting vehicle capacity
- Perfect for development and demonstration

## 🎨 Customization

### Changing Map Center
Edit `/utils/mockData.ts`:
```typescript
const centerLat = 37.7749;  // Your city latitude
const centerLng = -122.4194; // Your city longitude
```

### Adjusting Route Colors
Edit `/utils/colors.ts` to modify the color palette:
```typescript
const ROUTE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  // Add your colors...
];
```

### Animation Speed
Edit `/components/RoutesAnimation.tsx`:
```typescript
const duration = 2000; // milliseconds per segment
```

## 📦 Dependencies

### Core
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `typescript`: ^5.6.2

### UI & Styling
- `tailwindcss`: ^4.0.0
- `motion`: ^12.0.0 (Framer Motion)
- `lucide-react`: ^0.462.0

### Maps
- `leaflet`: ^1.9.4
- `react-leaflet`: ^4.2.1

### Charts
- `recharts`: ^2.15.0

### shadcn/ui Components
- button, card, slider, input, label, switch, separator, and more

## 🐛 Troubleshooting

### Map not displaying
- Ensure Leaflet CSS is imported
- Check browser console for tile loading errors
- Verify internet connection for map tiles

### WebSocket connection fails
- The app automatically falls back to sync optimization
- Check backend WebSocket server is running
- Verify WebSocket URL is correct

### Animation not smooth
- Check browser performance
- Reduce number of customers
- Adjust animation duration

## 🚧 Future Enhancements

- [ ] 3D route visualization
- [ ] Multiple depot support
- [ ] Time windows constraints
- [ ] Export routes to CSV/JSON
- [ ] Print optimization report
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Historical optimization runs
- [ ] Route comparison mode
- [ ] Advanced constraint configuration

## 📄 License

MIT License - Feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and TailwindCSS
