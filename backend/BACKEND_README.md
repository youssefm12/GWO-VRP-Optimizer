# VRP Optimizer Backend

A FastAPI-based backend for the Grey Wolf Optimizer (GWO) Vehicle Routing Problem solver.

## Features

- **Dataset Management**: Upload, generate, scan, and ingest VRP datasets
- **Job Management**: Create, run, and track optimization jobs
- **Real-time Updates**: WebSocket support for live optimization progress
- **Multiple Formats**: Support for CSV, JSON, TSPLIB/CVRPLIB formats
- **SQLite Persistence**: All datasets and job results are persisted

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python run.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 3. API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Health Check

```
GET /health
```

### Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/datasets` | List all datasets |
| GET | `/datasets/{id}` | Get dataset by ID |
| POST | `/datasets` | Create dataset from VRP data |
| POST | `/datasets/generate` | Generate synthetic dataset |
| POST | `/datasets/scan` | Scan directories for data files |
| POST | `/datasets/ingest` | Ingest files into database |
| POST | `/datasets/auto-ingest` | Scan and auto-ingest all found |
| DELETE | `/datasets/{id}` | Delete dataset |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | List all jobs |
| GET | `/jobs/{id}` | Get job details and result |
| POST | `/jobs` | Create new job |
| POST | `/jobs/{id}/start` | Start job (async) |
| POST | `/jobs/{id}/run` | Run job synchronously |
| POST | `/jobs/{id}/cancel` | Cancel running job |
| DELETE | `/jobs/{id}` | Delete job |

### Direct Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/optimize_sync` | Run optimization directly |
| POST | `/generate_instance` | Generate random VRP instance |
| WS | `/ws/optimize` | WebSocket real-time optimization |

## Frontend Integration

### HTTP Sync Optimization

```typescript
const response = await fetch('http://localhost:8000/optimize_sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      numWolves: 30,
      numIterations: 100,
      randomSeed: 42,
      vehicleCapacity: 100,
      penaltyCoefficient: 1000
    },
    vrpData: {
      depot: { lat: 37.7749, lng: -122.4194 },
      customers: [
        { id: 1, lat: 37.78, lng: -122.41, demand: 20 },
        // ...
      ]
    }
  })
});

const result = await response.json();
console.log(result.routes, result.best_fitness);
```

### WebSocket Real-time Optimization

```typescript
const ws = new WebSocket('ws://localhost:8000/ws/optimize');

ws.onopen = () => {
  ws.send(JSON.stringify({
    config: { numWolves: 30, numIterations: 100, ... },
    vrpData: { depot: {...}, customers: [...] }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.done) {
    console.log('Completed:', data.routes, data.best_fitness);
  } else {
    console.log('Progress:', data.iter, data.best_fitness);
  }
};
```

### Using Datasets and Jobs

```typescript
// List datasets
const datasets = await fetch('http://localhost:8000/datasets').then(r => r.json());

// Create job from dataset
const job = await fetch('http://localhost:8000/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dataset_id: datasets.datasets[0].id,
    config: { numWolves: 30, numIterations: 100, vehicleCapacity: 100 }
  })
}).then(r => r.json());

// Run job and get result
const result = await fetch(`http://localhost:8000/jobs/${job.metadata.id}/run`, {
  method: 'POST'
}).then(r => r.json());
```

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

### TSPLIB/CVRPLIB Format
```
NAME : instance
TYPE : CVRP
DIMENSION : 10
CAPACITY : 100
NODE_COORD_SECTION
1 0 0
2 10 10
...
DEMAND_SECTION
1 0
2 15
...
DEPOT_SECTION
1
-1
EOF
```

## Running Tests

```bash
python run_tests.py
```

Or with pytest directly:

```bash
pytest tests/ -v
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic models
│   ├── database.py          # SQLite operations
│   ├── dataset_scanner.py   # Dataset parsing/ingestion
│   ├── data_generator.py    # Synthetic data generation
│   ├── gwo_optimizer.py     # GWO algorithm implementation
│   ├── job_manager.py       # Job execution management
│   └── streamlit_app.py     # Original Streamlit demo
├── data/                    # Sample datasets
├── tests/                   # Test suite
├── requirements.txt
├── run.py                   # Server runner
└── run_tests.py            # Test runner
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VRP_DATABASE_PATH` | `vrp_data.db` | SQLite database path |

## CORS

The backend allows CORS from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`
- All origins (`*`) for development

Update `app/main.py` for production CORS settings.
