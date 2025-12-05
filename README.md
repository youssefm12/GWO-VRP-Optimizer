# VRP Optimizer - Grey Wolf Optimization

A full-stack Vehicle Routing Problem (VRP) optimization application using the Grey Wolf Optimizer (GWO) algorithm.

![VRP Optimizer](https://img.shields.io/badge/VRP-Optimizer-blue)
![Python](https://img.shields.io/badge/Python-3.12-green)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-teal)

## Features

- **Grey Wolf Optimizer**: Meta-heuristic optimization algorithm inspired by grey wolf hunting behavior
- **Real-time Visualization**: Interactive 2D/3D map views with route animations
- **WebSocket Updates**: Live optimization progress streaming
- **Dataset Management**: Import, generate, and manage VRP datasets
- **Multiple Formats**: Support for CSV, JSON, and TSPLIB/CVRPLIB formats
- **Comparison Mode**: Side-by-side baseline vs optimized route comparison
- **Responsive UI**: Modern React frontend with Tailwind CSS

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and setup backend:**
```bash
cd GWO-Project

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

2. **Setup frontend:**
```bash
cd frontend
npm install
```

### Running the Application

**Option 1: Use startup scripts (Windows)**
```bash
# Start both backend and frontend
start_all.bat

# Or start individually:
start_backend.bat
start_frontend.bat
```

**Option 2: Manual startup**

Terminal 1 - Backend:
```bash
cd backend
python run.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

3. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Architecture

```
GWO-Project/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # API endpoints
│   │   ├── models.py          # Pydantic models
│   │   ├── database.py        # SQLite persistence
│   │   ├── gwo_optimizer.py   # GWO algorithm
│   │   ├── job_manager.py     # Job execution
│   │   ├── dataset_scanner.py # Data file parsing
│   │   └── data_generator.py  # Synthetic data
│   ├── data/                  # Sample datasets
│   ├── tests/                 # Test suite
│   └── requirements.txt
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api/              # Backend API client
│   │   ├── components/       # React components
│   │   │   ├── MapView.tsx   # 2D map visualization
│   │   │   ├── MapView3D.tsx # 3D visualization
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   └── Charts/       # Convergence charts
│   │   └── utils/            # Helpers
│   └── package.json
│
└── venv/                      # Python virtual environment
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/datasets` | GET/POST | List/create datasets |
| `/datasets/generate` | POST | Generate synthetic dataset |
| `/datasets/{id}` | GET/DELETE | Get/delete dataset |
| `/jobs` | GET/POST | List/create optimization jobs |
| `/jobs/{id}/run` | POST | Run job synchronously |
| `/optimize_sync` | POST | Direct optimization |
| `/ws/optimize` | WebSocket | Real-time optimization |

## Usage Guide

### 1. Select or Generate a Dataset

- Use the **Dataset** dropdown to select an existing dataset
- Click **Generate New Dataset** to create synthetic data
- Click **Import** to scan and import data files from the backend

### 2. Configure Parameters

**Algorithm Parameters:**
- **Population (Wolves)**: Number of wolves in the pack (10-100)
- **Iterations**: Maximum optimization iterations (50-500)
- **Random Seed**: For reproducible results

**VRP Configuration:**
- **Vehicle Capacity**: Maximum load per vehicle
- **Penalty Coefficient**: For constraint violations
- **Number of Customers**: Dataset size

### 3. Run Optimization

- **Run Optimization (Sync)**: Runs and returns complete result
- **Run Optimization (WebSocket)**: Streams real-time progress updates

### 4. Analyze Results

- View optimized routes on the 2D/3D map
- Check convergence chart for algorithm progress
- Compare baseline vs optimized fitness
- Use Comparison Mode for side-by-side view

## Dataset Formats

### CSV Format
```csv
id,lat,lng,demand
0,37.7749,-122.4194,0
1,37.7849,-122.4094,20
2,37.7649,-122.4294,15
```

### JSON Format
```json
{
  "depot": { "lat": 37.7749, "lng": -122.4194 },
  "customers": [
    { "id": 1, "lat": 37.78, "lng": -122.41, "demand": 20 }
  ]
}
```

### TSPLIB Format
```
NAME : instance
TYPE : CVRP
DIMENSION : 10
CAPACITY : 100
NODE_COORD_SECTION
1 0 0
...
DEMAND_SECTION
1 0
...
DEPOT_SECTION
1
-1
EOF
```

## Grey Wolf Optimizer Algorithm

The GWO algorithm mimics the leadership hierarchy and hunting mechanism of grey wolves:

1. **Alpha (α)**: Best solution - leads the hunt
2. **Beta (β)**: Second-best solution - assists alpha
3. **Delta (δ)**: Third-best solution - follows alpha and beta
4. **Omega (ω)**: Rest of the pack - follows all leaders

**Hunting Phases:**
- **Encircling**: Wolves surround the prey
- **Hunting**: Guided by alpha, beta, and delta positions
- **Attacking**: Converge towards the prey (exploitation)
- **Searching**: Diverge to find prey (exploration)

## Running Tests

```bash
cd backend
python run_tests.py

# Or with pytest directly:
pytest tests/ -v
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

## Technologies

**Backend:**
- Python 3.12
- FastAPI
- NumPy
- SQLite
- WebSockets

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Three.js (3D visualization)
- Framer Motion

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
