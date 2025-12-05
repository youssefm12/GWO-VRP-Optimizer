"""
FastAPI main application for VRP optimization backend.
"""
import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import json

from . import database as db
from .models import (
    OptimizationRequest, OptimizationResponse, OptimizationConfig,
    VRPData, Customer, Coordinate, Depot,
    DatasetCreate, DatasetGenerateRequest, DatasetResponse, DatasetListResponse, DatasetMetadata,
    JobCreate, JobResponse, JobListResponse, JobStatus, JobMetadata, JobResult,
    ScanResponse, IngestRequest, IngestResponse, RouteInfo,
    ProgressUpdate, FinalResult
)
from .dataset_scanner import DatasetScanner
from .data_generator import generate_vrp_data, create_generated_dataset, regenerate_instance
from . import job_manager
from .gwo_optimizer import VRPOptimizer, OptimizationProgress


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    db.init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="VRP Optimizer API",
    description="Grey Wolf Optimizer backend for Vehicle Routing Problem",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health Check ---

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "vrp-optimizer"}


# --- Dataset Endpoints ---

@app.get("/datasets", response_model=DatasetListResponse)
async def list_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """List all datasets with pagination."""
    datasets, total = db.list_datasets(skip=skip, limit=limit)
    return DatasetListResponse(datasets=datasets, total=total)


@app.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: str):
    """Get a dataset by ID."""
    result = db.get_dataset(dataset_id)
    if not result:
        raise HTTPException(status_code=404, detail="Dataset not found")
    metadata, vrp_data = result
    return DatasetResponse(metadata=metadata, vrp_data=vrp_data)


@app.post("/datasets", response_model=DatasetResponse)
async def create_dataset(request: DatasetCreate):
    """Create a new dataset from provided VRP data."""
    from .models import DatasetFormat
    import uuid
    from datetime import datetime
    
    total_demand = sum(c.demand for c in request.vrp_data.customers)
    
    metadata = DatasetMetadata(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description,
        format=DatasetFormat.JSON,
        num_customers=len(request.vrp_data.customers),
        num_depots=1,
        total_demand=total_demand,
        created_at=datetime.utcnow()
    )
    
    db.save_dataset(metadata, request.vrp_data)
    return DatasetResponse(metadata=metadata, vrp_data=request.vrp_data)


@app.post("/datasets/generate", response_model=DatasetResponse)
async def generate_dataset(request: DatasetGenerateRequest):
    """Generate a new synthetic dataset."""
    metadata, vrp_data = create_generated_dataset(request)
    return DatasetResponse(metadata=metadata, vrp_data=vrp_data)


@app.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset and all associated jobs."""
    if not db.delete_dataset(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"message": "Dataset deleted successfully"}


# --- Dataset Scanning/Ingestion ---

@app.post("/datasets/scan", response_model=ScanResponse)
async def scan_datasets(
    directories: Optional[List[str]] = None,
    recursive: bool = True
):
    """Scan directories for VRP data files."""
    scanner = DatasetScanner()
    return scanner.scan(directories=directories, recursive=recursive)


@app.post("/datasets/ingest", response_model=IngestResponse)
async def ingest_datasets(request: IngestRequest):
    """Ingest datasets from file paths."""
    scanner = DatasetScanner()
    return scanner.ingest(paths=request.paths, overwrite=request.overwrite)


@app.post("/datasets/auto-ingest", response_model=IngestResponse)
async def auto_ingest_datasets(directories: Optional[List[str]] = None):
    """Scan and automatically ingest all valid datasets found."""
    scanner = DatasetScanner()
    return scanner.auto_ingest(directories=directories)


# --- Job Endpoints ---

@app.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    dataset_id: Optional[str] = None,
    status: Optional[JobStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """List jobs with optional filtering."""
    jobs, total = db.list_jobs(
        dataset_id=dataset_id,
        status=status,
        skip=skip,
        limit=limit
    )
    return JobListResponse(jobs=jobs, total=total)


@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get job details and result if completed."""
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    result = None
    if job.status == JobStatus.COMPLETED:
        result = db.get_job_result(job_id)
    
    return JobResponse(metadata=job, result=result)


@app.post("/jobs", response_model=JobResponse)
async def create_job(request: JobCreate):
    """Create a new optimization job."""
    try:
        job = job_manager.create_job(
            dataset_id=request.dataset_id,
            config=request.config,
            name=request.name
        )
        return JobResponse(metadata=job)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/jobs/{job_id}/start", response_model=JobResponse)
async def start_job(job_id: str):
    """Start a pending job (async background execution)."""
    try:
        job = job_manager.start_job(job_id)
        return JobResponse(metadata=job)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/jobs/{job_id}/run", response_model=JobResponse)
async def run_job_sync(job_id: str):
    """Run a job synchronously and wait for result."""
    try:
        result = job_manager.run_job_sync(job_id)
        job = db.get_job(job_id)
        return JobResponse(metadata=job, result=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running job."""
    if job_manager.cancel_job(job_id):
        return {"message": "Job cancelled"}
    raise HTTPException(status_code=400, detail="Job cannot be cancelled")


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and its result."""
    if not db.delete_job(job_id):
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}


# --- Direct Optimization Endpoints ---

@app.post("/optimize_sync", response_model=OptimizationResponse)
async def optimize_sync(request: OptimizationRequest):
    """
    Run synchronous optimization without creating a persistent job.
    Returns full result when complete.
    """
    depot = (request.vrpData.depot.lat, request.vrpData.depot.lng)
    customers = [
        {
            "id": c.id,
            "lat": c.lat,
            "lng": c.lng,
            "demand": c.demand
        }
        for c in request.vrpData.customers
    ]
    
    optimizer = VRPOptimizer(
        depot=depot,
        customers=customers,
        vehicle_capacity=request.config.vehicleCapacity,
        num_wolves=request.config.numWolves,
        num_iterations=request.config.numIterations,
        penalty_coefficient=request.config.penaltyCoefficient,
        seed=request.config.randomSeed
    )
    
    result = optimizer.optimize()
    
    return OptimizationResponse(
        routes=result.routes,
        best_fitness=result.best_fitness,
        convergence_history=result.convergence_history,
        runtime=result.runtime,
        route_details=[
            RouteInfo(route=rd["route"], distance=rd["distance"], load=rd["load"])
            for rd in result.route_details
        ]
    )


@app.post("/generate_instance")
async def generate_instance(data: dict):
    """Generate a new random VRP instance."""
    num_customers = data.get("num_customers", 20)
    seed = data.get("seed")
    
    vrp_data = regenerate_instance(num_customers, seed)
    
    return {
        "depot": {"lat": vrp_data.depot.lat, "lng": vrp_data.depot.lng},
        "depots": [
            {"id": d.id, "lat": d.lat, "lng": d.lng, "name": d.name}
            for d in (vrp_data.depots or [])
        ],
        "customers": [
            {"id": c.id, "lat": c.lat, "lng": c.lng, "demand": c.demand}
            for c in vrp_data.customers
        ]
    }


# --- WebSocket Endpoint ---

@app.websocket("/ws/optimize")
async def websocket_optimize(websocket: WebSocket):
    """
    WebSocket endpoint for real-time optimization with progress updates.
    
    Client sends:
    {
        "config": { "numWolves": 30, "numIterations": 100, ... },
        "vrpData": { "depot": {...}, "customers": [...] }
    }
    
    Server sends progress:
    { "iter": 5, "best_fitness": 123.45 }
    
    Server sends final result:
    { "done": true, "routes": [...], "best_fitness": 100.0, "runtime": 2.5 }
    """
    await websocket.accept()
    
    try:
        # Receive optimization request
        data = await websocket.receive_json()
        
        config = OptimizationConfig(**data["config"])
        vrp_data = VRPData(**data["vrpData"])
        
        # Progress callback
        async def send_progress(progress: OptimizationProgress):
            await websocket.send_json({
                "iter": progress.iteration,
                "best_fitness": progress.best_fitness
            })
        
        # Prepare data
        depot = (vrp_data.depot.lat, vrp_data.depot.lng)
        customers = [
            {
                "id": c.id,
                "lat": c.lat,
                "lng": c.lng,
                "demand": c.demand
            }
            for c in vrp_data.customers
        ]
        
        # Create optimizer
        optimizer = VRPOptimizer(
            depot=depot,
            customers=customers,
            vehicle_capacity=config.vehicleCapacity,
            num_wolves=config.numWolves,
            num_iterations=config.numIterations,
            penalty_coefficient=config.penaltyCoefficient,
            seed=config.randomSeed
        )
        
        # Run optimization with progress updates
        loop = asyncio.get_event_loop()
        
        progress_queue = asyncio.Queue()
        
        def on_progress(progress: OptimizationProgress):
            try:
                progress_queue.put_nowait(progress)
            except asyncio.QueueFull:
                pass
        
        # Start optimization in thread pool
        import concurrent.futures
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        
        future = loop.run_in_executor(
            executor,
            lambda: optimizer.optimize(progress_callback=on_progress, progress_interval=1)
        )
        
        # Send progress updates while optimization runs
        while not future.done():
            try:
                progress = await asyncio.wait_for(progress_queue.get(), timeout=0.1)
                await websocket.send_json({
                    "iter": progress.iteration,
                    "best_fitness": round(progress.best_fitness, 4)
                })
            except asyncio.TimeoutError:
                pass
            except WebSocketDisconnect:
                optimizer.cancel()
                return
        
        # Get final result
        result = await future
        
        # Send any remaining progress updates
        while not progress_queue.empty():
            try:
                progress = progress_queue.get_nowait()
                await websocket.send_json({
                    "iter": progress.iteration,
                    "best_fitness": round(progress.best_fitness, 4)
                })
            except asyncio.QueueEmpty:
                break
        
        # Send final result
        await websocket.send_json({
            "done": True,
            "routes": result.routes,
            "best_fitness": round(result.best_fitness, 4),
            "runtime": result.runtime
        })
        
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# --- Run server ---

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
