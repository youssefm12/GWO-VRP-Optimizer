# 🔌 Backend Integration Guide

This guide explains how to integrate the VRP Optimizer frontend with your Grey Wolf Optimizer backend.

## API Specification

### Base URL Configuration

Update the API URLs in your application:

**File: `/App.tsx`**
```typescript
// Line ~94 (handleOptimizeRealtime function)
const wsUrl = 'ws://YOUR_BACKEND_URL/ws/optimize';
```

Or use environment variables:

**File: `/.env`**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/optimize
```

Then in your code:
```typescript
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/optimize';
```

## Endpoint Specifications

### 1. Real-time Optimization (WebSocket)

**Endpoint**: `ws://your-backend/ws/optimize`

#### Client → Server (Initial Request)
```json
{
  "config": {
    "numWolves": 30,
    "numIterations": 100,
    "randomSeed": 42,
    "vehicleCapacity": 100,
    "penaltyCoefficient": 1000
  },
  "vrpData": {
    "depot": {
      "lat": 37.7749,
      "lng": -122.4194
    },
    "customers": [
      {
        "id": 1,
        "lat": 37.7849,
        "lng": -122.4094,
        "demand": 20
      },
      {
        "id": 2,
        "lat": 37.7949,
        "lng": -122.3994,
        "demand": 15
      }
      // ... more customers
    ]
  }
}
```

#### Server → Client (Progress Updates)
```json
{
  "iter": 5,
  "best_fitness": 231.5
}
```

Send this message after each iteration or every N iterations for better performance.

#### Server → Client (Final Result)
```json
{
  "done": true,
  "routes": [
    [0, 3, 5, 8, 0],
    [0, 1, 2, 6, 0],
    [0, 4, 7, 9, 0]
  ],
  "best_fitness": 210.33,
  "runtime": 2.5
}
```

**Route Format**:
- Each route is an array of node IDs
- `0` represents the depot
- Other numbers represent customer IDs
- Routes must start and end at depot: `[0, customers..., 0]`

---

### 2. Synchronous Optimization (HTTP)

**Endpoint**: `POST http://your-backend/optimize_sync`

#### Request
```json
{
  "config": {
    "numWolves": 30,
    "numIterations": 100,
    "randomSeed": 42,
    "vehicleCapacity": 100,
    "penaltyCoefficient": 1000
  },
  "vrpData": {
    "depot": {
      "lat": 37.7749,
      "lng": -122.4194
    },
    "customers": [...]
  }
}
```

#### Response
```json
{
  "routes": [
    [0, 3, 5, 8, 0],
    [0, 1, 2, 6, 0]
  ],
  "best_fitness": 210.33,
  "convergence_history": [
    { "iteration": 0, "fitness": 300.5 },
    { "iteration": 5, "fitness": 285.2 },
    { "iteration": 10, "fitness": 270.1 },
    { "iteration": 15, "fitness": 255.8 }
    // ... more iterations
  ],
  "runtime": 2.5
}
```

---

### 3. Generate VRP Instance (Optional)

**Endpoint**: `POST http://your-backend/generate_instance`

#### Request
```json
{
  "num_customers": 20
}
```

#### Response
```json
{
  "depot": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "customers": [
    {
      "id": 1,
      "lat": 37.7849,
      "lng": -122.4094,
      "demand": 20
    }
    // ... 19 more customers
  ]
}
```

---

## Python FastAPI Example

### Installation
```bash
pip install fastapi uvicorn websockets numpy
```

### Backend Implementation

**File: `backend/main.py`**
```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import asyncio
import json
import numpy as np

app = FastAPI(title="VRP Optimizer API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Customer(BaseModel):
    id: int
    lat: float
    lng: float
    demand: int

class Depot(BaseModel):
    lat: float
    lng: float

class VRPData(BaseModel):
    depot: Depot
    customers: List[Customer]

class OptimizationConfig(BaseModel):
    numWolves: int
    numIterations: int
    randomSeed: int
    vehicleCapacity: int
    penaltyCoefficient: int

class OptimizationRequest(BaseModel):
    config: OptimizationConfig
    vrpData: VRPData

# Mock GWO Algorithm (Replace with your actual implementation)
class GreyWolfOptimizer:
    def __init__(self, config: OptimizationConfig, vrp_data: VRPData):
        self.config = config
        self.vrp_data = vrp_data
        np.random.seed(config.randomSeed)
    
    def optimize(self):
        """
        Implement your actual GWO algorithm here.
        This is a mock implementation.
        """
        convergence = []
        best_fitness = 1000.0
        
        for i in range(self.config.numIterations):
            # Simulate optimization
            best_fitness = best_fitness * 0.98 + np.random.random() * 2
            
            if i % 5 == 0:
                convergence.append({
                    "iteration": i,
                    "fitness": round(best_fitness, 2)
                })
        
        # Generate mock routes
        routes = self._generate_routes()
        
        return {
            "routes": routes,
            "best_fitness": round(best_fitness, 2),
            "convergence_history": convergence,
            "runtime": self.config.numIterations * 0.025
        }
    
    def _generate_routes(self):
        """Generate mock routes respecting capacity constraint"""
        routes = []
        current_route = [0]
        current_capacity = 0
        
        for customer in self.vrp_data.customers:
            if current_capacity + customer.demand > self.config.vehicleCapacity:
                current_route.append(0)
                routes.append(current_route)
                current_route = [0]
                current_capacity = 0
            
            current_route.append(customer.id)
            current_capacity += customer.demand
        
        if len(current_route) > 1:
            current_route.append(0)
            routes.append(current_route)
        
        return routes

# REST API Endpoints
@app.post("/optimize_sync")
async def optimize_sync(request: OptimizationRequest):
    """Synchronous optimization endpoint"""
    optimizer = GreyWolfOptimizer(request.config, request.vrpData)
    result = optimizer.optimize()
    return result

@app.post("/generate_instance")
async def generate_instance(data: Dict):
    """Generate random VRP instance"""
    num_customers = data.get("num_customers", 20)
    
    depot = {"lat": 37.7749, "lng": -122.4194}
    customers = []
    
    for i in range(num_customers):
        customers.append({
            "id": i + 1,
            "lat": depot["lat"] + (np.random.random() - 0.5) * 0.2,
            "lng": depot["lng"] + (np.random.random() - 0.5) * 0.2,
            "demand": np.random.randint(10, 40)
        })
    
    return {"depot": depot, "customers": customers}

# WebSocket endpoint
@app.websocket("/ws/optimize")
async def websocket_optimize(websocket: WebSocket):
    """Real-time optimization with progress updates"""
    await websocket.accept()
    
    try:
        # Receive optimization request
        data = await websocket.receive_json()
        config = OptimizationConfig(**data["config"])
        vrp_data = VRPData(**data["vrpData"])
        
        optimizer = GreyWolfOptimizer(config, vrp_data)
        best_fitness = 1000.0
        
        # Send progress updates
        for i in range(config.numIterations):
            # Simulate optimization
            best_fitness = best_fitness * 0.98 + np.random.random() * 2
            
            # Send update every 5 iterations
            if i % 5 == 0:
                await websocket.send_json({
                    "iter": i,
                    "best_fitness": round(best_fitness, 2)
                })
            
            # Simulate processing time
            await asyncio.sleep(0.02)
        
        # Send final result
        routes = optimizer._generate_routes()
        await websocket.send_json({
            "done": True,
            "routes": routes,
            "best_fitness": round(best_fitness, 2),
            "runtime": config.numIterations * 0.025
        })
        
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Run the Backend
```bash
python backend/main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Node.js Express Example

### Installation
```bash
npm install express ws cors body-parser
```

### Backend Implementation

**File: `backend/server.js`**
```javascript
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(bodyParser.json());

// Mock GWO optimization
function runGWOOptimization(config, vrpData, onProgress) {
  return new Promise((resolve) => {
    let bestFitness = 1000;
    const convergenceHistory = [];
    
    const interval = setInterval(() => {
      if (convergenceHistory.length >= config.numIterations / 5) {
        clearInterval(interval);
        
        // Generate routes
        const routes = generateRoutes(vrpData.customers, config.vehicleCapacity);
        
        resolve({
          routes,
          best_fitness: bestFitness,
          convergence_history: convergenceHistory,
          runtime: config.numIterations * 0.025
        });
        return;
      }
      
      bestFitness = bestFitness * 0.98 + Math.random() * 2;
      const iteration = convergenceHistory.length * 5;
      
      convergenceHistory.push({
        iteration,
        fitness: parseFloat(bestFitness.toFixed(2))
      });
      
      if (onProgress) {
        onProgress({ iter: iteration, best_fitness: parseFloat(bestFitness.toFixed(2)) });
      }
    }, 100);
  });
}

function generateRoutes(customers, capacity) {
  const routes = [];
  let currentRoute = [0];
  let currentCapacity = 0;
  
  customers.forEach((customer) => {
    if (currentCapacity + customer.demand > capacity) {
      currentRoute.push(0);
      routes.push([...currentRoute]);
      currentRoute = [0];
      currentCapacity = 0;
    }
    currentRoute.push(customer.id);
    currentCapacity += customer.demand;
  });
  
  if (currentRoute.length > 1) {
    currentRoute.push(0);
    routes.push(currentRoute);
  }
  
  return routes;
}

// REST endpoint
app.post('/optimize_sync', async (req, res) => {
  const { config, vrpData } = req.body;
  const result = await runGWOOptimization(config, vrpData);
  res.json(result);
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws/optimize' });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', async (message) => {
    const { config, vrpData } = JSON.parse(message);
    
    const result = await runGWOOptimization(config, vrpData, (progress) => {
      ws.send(JSON.stringify(progress));
    });
    
    ws.send(JSON.stringify({ done: true, ...result }));
  });
});
```

---

## Testing the Integration

### 1. Test Health Endpoint
```bash
curl http://localhost:8000/health
```

### 2. Test Sync Optimization
```bash
curl -X POST http://localhost:8000/optimize_sync \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "numWolves": 30,
      "numIterations": 100,
      "randomSeed": 42,
      "vehicleCapacity": 100,
      "penaltyCoefficient": 1000
    },
    "vrpData": {
      "depot": {"lat": 37.7749, "lng": -122.4194},
      "customers": [
        {"id": 1, "lat": 37.7849, "lng": -122.4094, "demand": 20}
      ]
    }
  }'
```

### 3. Test WebSocket (using wscat)
```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws/optimize
```

Then send:
```json
{"config": {...}, "vrpData": {...}}
```

---

## Error Handling

### Frontend Fallback
The frontend automatically falls back to sync optimization if WebSocket fails:

```typescript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Fallback to sync optimization
  handleOptimizeSync();
};
```

### Backend Error Responses

#### HTTP Errors
```json
{
  "error": "Invalid request",
  "message": "Number of iterations must be positive",
  "status": 400
}
```

#### WebSocket Errors
```json
{
  "error": "Optimization failed",
  "message": "Insufficient memory"
}
```

---

## Performance Optimization

### For Large Problems (50+ customers)

1. **Batch Progress Updates**
```python
if i % 10 == 0:  # Update every 10 iterations instead of 5
    await websocket.send_json({...})
```

2. **Compress Routes**
```python
# Use route encoding if routes are very large
import json
import gzip
compressed = gzip.compress(json.dumps(routes).encode())
```

3. **Use Binary WebSocket**
```python
import msgpack
await websocket.send_bytes(msgpack.packb(data))
```

---

## Deployment Considerations

### CORS for Production
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-production-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### HTTPS/WSS
For production, use secure connections:
- HTTP → HTTPS
- WS → WSS

```typescript
const wsUrl = 'wss://your-backend.com/ws/optimize';
```

### Authentication (Optional)
Add JWT or API key authentication:

```python
from fastapi import Header, HTTPException

async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    # Verify token
```

---

## Troubleshooting

### Connection Refused
- ✅ Check if backend is running
- ✅ Verify port and URL are correct
- ✅ Check firewall settings

### CORS Errors
- ✅ Add frontend origin to CORS allowed origins
- ✅ Ensure credentials are properly configured

### WebSocket Disconnects
- ✅ Add keepalive/ping messages
- ✅ Implement reconnection logic
- ✅ Handle connection timeouts

---

Ready to integrate your GWO backend! 🚀
