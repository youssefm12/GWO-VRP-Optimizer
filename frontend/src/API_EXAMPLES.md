# 🔌 API Request & Response Examples

Complete examples of all API interactions for backend developers.

## Table of Contents
1. [WebSocket Real-time Optimization](#websocket-real-time-optimization)
2. [HTTP Synchronous Optimization](#http-synchronous-optimization)
3. [Generate VRP Instance](#generate-vrp-instance)
4. [Error Responses](#error-responses)

---

## WebSocket Real-time Optimization

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/optimize');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify(requestData));
};
```

### Client Request (Small Problem)

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
      },
      {
        "id": 3,
        "lat": 37.7649,
        "lng": -122.4294,
        "demand": 25
      },
      {
        "id": 4,
        "lat": 37.7549,
        "lng": -122.4394,
        "demand": 30
      },
      {
        "id": 5,
        "lat": 37.7449,
        "lng": -122.4494,
        "demand": 18
      }
    ]
  }
}
```

### Server Progress Updates

```json
// Iteration 0
{
  "iter": 0,
  "best_fitness": 450.5
}

// Iteration 5
{
  "iter": 5,
  "best_fitness": 380.2
}

// Iteration 10
{
  "iter": 10,
  "best_fitness": 340.8
}

// ... more iterations ...

// Iteration 95
{
  "iter": 95,
  "best_fitness": 210.5
}
```

### Server Final Response

```json
{
  "done": true,
  "routes": [
    [0, 1, 2, 0],
    [0, 3, 4, 5, 0]
  ],
  "best_fitness": 210.33,
  "runtime": 2.5
}
```

**Route Explanation**:
- `[0, 1, 2, 0]` - Vehicle 1: Depot → Customer 1 → Customer 2 → Depot
- `[0, 3, 4, 5, 0]` - Vehicle 2: Depot → Customer 3 → Customer 4 → Customer 5 → Depot

---

## HTTP Synchronous Optimization

### Request

```bash
curl -X POST http://localhost:8000/optimize_sync \
  -H "Content-Type: application/json" \
  -d @request.json
```

**File: `request.json`**
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
      },
      {
        "id": 3,
        "lat": 37.7649,
        "lng": -122.4294,
        "demand": 25
      },
      {
        "id": 4,
        "lat": 37.7549,
        "lng": -122.4394,
        "demand": 30
      },
      {
        "id": 5,
        "lat": 37.7449,
        "lng": -122.4494,
        "demand": 18
      },
      {
        "id": 6,
        "lat": 37.7349,
        "lng": -122.4594,
        "demand": 22
      },
      {
        "id": 7,
        "lat": 37.7249,
        "lng": -122.4694,
        "demand": 28
      },
      {
        "id": 8,
        "lat": 37.7149,
        "lng": -122.4794,
        "demand": 16
      }
    ]
  }
}
```

### Response

```json
{
  "routes": [
    [0, 1, 2, 3, 0],
    [0, 4, 5, 6, 0],
    [0, 7, 8, 0]
  ],
  "best_fitness": 315.67,
  "convergence_history": [
    { "iteration": 0, "fitness": 550.3 },
    { "iteration": 5, "fitness": 480.5 },
    { "iteration": 10, "fitness": 430.2 },
    { "iteration": 15, "fitness": 395.8 },
    { "iteration": 20, "fitness": 370.4 },
    { "iteration": 25, "fitness": 355.1 },
    { "iteration": 30, "fitness": 343.9 },
    { "iteration": 35, "fitness": 335.2 },
    { "iteration": 40, "fitness": 328.7 },
    { "iteration": 45, "fitness": 324.3 },
    { "iteration": 50, "fitness": 321.5 },
    { "iteration": 55, "fitness": 319.8 },
    { "iteration": 60, "fitness": 318.7 },
    { "iteration": 65, "fitness": 317.9 },
    { "iteration": 70, "fitness": 317.3 },
    { "iteration": 75, "fitness": 316.8 },
    { "iteration": 80, "fitness": 316.4 },
    { "iteration": 85, "fitness": 316.1 },
    { "iteration": 90, "fitness": 315.9 },
    { "iteration": 95, "fitness": 315.7 },
    { "iteration": 100, "fitness": 315.67 }
  ],
  "runtime": 2.5
}
```

**Response Fields**:
- `routes`: Array of vehicle routes (each starts and ends at depot 0)
- `best_fitness`: Total distance in kilometers
- `convergence_history`: Fitness value at various iterations
- `runtime`: Execution time in seconds

---

## Generate VRP Instance

### Request

```bash
curl -X POST http://localhost:8000/generate_instance \
  -H "Content-Type: application/json" \
  -d '{"num_customers": 10}'
```

### Response

```json
{
  "depot": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "customers": [
    {
      "id": 1,
      "lat": 37.7892,
      "lng": -122.4103,
      "demand": 23
    },
    {
      "id": 2,
      "lat": 37.7634,
      "lng": -122.4321,
      "demand": 18
    },
    {
      "id": 3,
      "lat": 37.7801,
      "lng": -122.4156,
      "demand": 35
    },
    {
      "id": 4,
      "lat": 37.7698,
      "lng": -122.4289,
      "demand": 27
    },
    {
      "id": 5,
      "lat": 37.7823,
      "lng": -122.4087,
      "demand": 31
    },
    {
      "id": 6,
      "lat": 37.7612,
      "lng": -122.4367,
      "demand": 19
    },
    {
      "id": 7,
      "lat": 37.7876,
      "lng": -122.4045,
      "demand": 29
    },
    {
      "id": 8,
      "lat": 37.7589,
      "lng": -122.4401,
      "demand": 22
    },
    {
      "id": 9,
      "lat": 37.7845,
      "lng": -122.4123,
      "demand": 26
    },
    {
      "id": 10,
      "lat": 37.7667,
      "lng": -122.4334,
      "demand": 33
    }
  ]
}
```

---

## Large Problem Example

### Request (50 Customers)

```json
{
  "config": {
    "numWolves": 50,
    "numIterations": 300,
    "randomSeed": 42,
    "vehicleCapacity": 150,
    "penaltyCoefficient": 2000
  },
  "vrpData": {
    "depot": {
      "lat": 37.7749,
      "lng": -122.4194
    },
    "customers": [
      // ... 50 customers with varying demands
    ]
  }
}
```

### Response Structure

```json
{
  "routes": [
    [0, 12, 34, 7, 45, 23, 0],
    [0, 5, 18, 39, 2, 0],
    [0, 28, 41, 15, 9, 33, 0],
    // ... more routes (typically 8-12 for 50 customers)
  ],
  "best_fitness": 1248.56,
  "convergence_history": [
    { "iteration": 0, "fitness": 2100.5 },
    // ... 60 data points (every 5 iterations)
  ],
  "runtime": 12.3
}
```

---

## Error Responses

### Invalid Request (400 Bad Request)

```json
{
  "error": "Invalid request",
  "message": "numIterations must be a positive integer",
  "field": "config.numIterations",
  "received": -10
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Optimization failed",
  "message": "Memory allocation failed for population size 1000",
  "details": "Consider reducing numWolves parameter"
}
```

### WebSocket Error

```json
{
  "error": "Connection lost",
  "message": "Optimization interrupted at iteration 45",
  "partial_result": {
    "iter": 45,
    "best_fitness": 350.2
  }
}
```

### Timeout Error

```json
{
  "error": "Request timeout",
  "message": "Optimization exceeded maximum time limit of 60 seconds",
  "elapsed_time": 60.1
}
```

---

## Validation Rules

### Config Parameters

| Parameter            | Type    | Min  | Max  | Default | Required |
|---------------------|---------|------|------|---------|----------|
| numWolves           | integer | 10   | 100  | 30      | Yes      |
| numIterations       | integer | 50   | 500  | 100     | Yes      |
| randomSeed          | integer | 0    | 9999 | 42      | Yes      |
| vehicleCapacity     | integer | 50   | 500  | 100     | Yes      |
| penaltyCoefficient  | integer | 100  | 9999 | 1000    | Yes      |

### VRP Data

| Field     | Type   | Validation                        | Required |
|-----------|--------|-----------------------------------|----------|
| depot.lat | float  | -90 to 90                         | Yes      |
| depot.lng | float  | -180 to 180                       | Yes      |
| customer.id | integer | Unique, > 0                    | Yes      |
| customer.lat | float | -90 to 90                       | Yes      |
| customer.lng | float | -180 to 180                     | Yes      |
| customer.demand | integer | > 0, < vehicleCapacity   | Yes      |

---

## Testing with JavaScript

### Using Fetch API

```javascript
// Synchronous optimization
async function optimizeSync() {
  const response = await fetch('http://localhost:8000/optimize_sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: { /* ... */ },
      vrpData: { /* ... */ }
    }),
  });
  
  const result = await response.json();
  console.log('Routes:', result.routes);
  console.log('Best fitness:', result.best_fitness);
}

// WebSocket optimization
function optimizeRealtime() {
  const ws = new WebSocket('ws://localhost:8000/ws/optimize');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      config: { /* ... */ },
      vrpData: { /* ... */ }
    }));
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.done) {
      console.log('Optimization complete!');
      console.log('Routes:', data.routes);
      ws.close();
    } else {
      console.log(`Iteration ${data.iter}: ${data.best_fitness}`);
    }
  };
}
```

---

## Testing with Python

### Using requests and websockets

```python
import requests
import json
import asyncio
import websockets

# Synchronous optimization
def optimize_sync():
    url = 'http://localhost:8000/optimize_sync'
    payload = {
        'config': {
            'numWolves': 30,
            'numIterations': 100,
            'randomSeed': 42,
            'vehicleCapacity': 100,
            'penaltyCoefficient': 1000
        },
        'vrpData': {
            'depot': {'lat': 37.7749, 'lng': -122.4194},
            'customers': [
                {'id': 1, 'lat': 37.7849, 'lng': -122.4094, 'demand': 20}
            ]
        }
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    print('Routes:', result['routes'])
    print('Best fitness:', result['best_fitness'])

# WebSocket optimization
async def optimize_realtime():
    url = 'ws://localhost:8000/ws/optimize'
    payload = {
        'config': { ... },
        'vrpData': { ... }
    }
    
    async with websockets.connect(url) as websocket:
        await websocket.send(json.dumps(payload))
        
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            
            if data.get('done'):
                print('Optimization complete!')
                print('Routes:', data['routes'])
                break
            else:
                print(f"Iteration {data['iter']}: {data['best_fitness']}")

# Run
asyncio.run(optimize_realtime())
```

---

## Rate Limiting (Recommended)

```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 requests per minute",
  "retry_after": 45
}
```

---

Ready to integrate! 🚀
