"""
Job manager for handling optimization jobs.
Supports background execution and progress tracking.
"""
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Optional, Callable, Any
from concurrent.futures import ThreadPoolExecutor
import threading

from .models import (
    JobMetadata, JobStatus, JobResult, JobCreate, OptimizationConfig,
    VRPData, RouteInfo
)
from . import database as db
from .gwo_optimizer import VRPOptimizer, OptimizationProgress, OptimizationResult


# Thread pool for running optimizations
_executor = ThreadPoolExecutor(max_workers=4)

# Active jobs tracking
_active_jobs: Dict[str, "JobRunner"] = {}
_jobs_lock = threading.Lock()


class JobRunner:
    """Runner for a single optimization job."""
    
    def __init__(
        self,
        job_id: str,
        dataset_id: str,
        config: OptimizationConfig,
        vrp_data: VRPData,
        progress_callback: Optional[Callable[[str, OptimizationProgress], None]] = None
    ):
        self.job_id = job_id
        self.dataset_id = dataset_id
        self.config = config
        self.vrp_data = vrp_data
        self.progress_callback = progress_callback
        
        self._optimizer: Optional[VRPOptimizer] = None
        self._cancelled = False
        self._future = None
    
    def run(self) -> Optional[JobResult]:
        """Run the optimization synchronously."""
        try:
            # Update job status to running
            db.update_job_status(self.job_id, JobStatus.RUNNING)
            
            # Prepare data
            depot = (self.vrp_data.depot.lat, self.vrp_data.depot.lng)
            customers = [
                {
                    "id": c.id,
                    "lat": c.lat,
                    "lng": c.lng,
                    "demand": c.demand
                }
                for c in self.vrp_data.customers
            ]
            
            # Create optimizer
            self._optimizer = VRPOptimizer(
                depot=depot,
                customers=customers,
                vehicle_capacity=self.config.vehicleCapacity,
                num_wolves=self.config.numWolves,
                num_iterations=self.config.numIterations,
                penalty_coefficient=self.config.penaltyCoefficient,
                seed=self.config.randomSeed
            )
            
            # Progress wrapper
            def on_progress(progress: OptimizationProgress):
                if self.progress_callback:
                    self.progress_callback(self.job_id, progress)
            
            # Run optimization
            result = self._optimizer.optimize(
                progress_callback=on_progress,
                progress_interval=5
            )
            
            if self._cancelled:
                db.update_job_status(self.job_id, JobStatus.CANCELLED)
                return None
            
            # Create job result
            job_result = JobResult(
                job_id=self.job_id,
                routes=result.routes,
                best_fitness=result.best_fitness,
                convergence_history=result.convergence_history,
                runtime=result.runtime,
                route_details=[
                    RouteInfo(
                        route=rd["route"],
                        distance=rd["distance"],
                        load=rd["load"]
                    )
                    for rd in result.route_details
                ]
            )
            
            # Save result
            db.save_job_result(job_result)
            db.update_job_status(self.job_id, JobStatus.COMPLETED)
            
            return job_result
            
        except Exception as e:
            db.update_job_status(self.job_id, JobStatus.FAILED, str(e))
            raise
        finally:
            # Remove from active jobs
            with _jobs_lock:
                if self.job_id in _active_jobs:
                    del _active_jobs[self.job_id]
    
    def cancel(self):
        """Cancel the optimization."""
        self._cancelled = True
        if self._optimizer:
            self._optimizer.cancel()


def create_job(
    dataset_id: str,
    config: OptimizationConfig,
    name: Optional[str] = None
) -> JobMetadata:
    """Create a new optimization job."""
    # Verify dataset exists
    dataset = db.get_dataset(dataset_id)
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")
    
    job = JobMetadata(
        id=str(uuid.uuid4()),
        dataset_id=dataset_id,
        name=name or f"Job_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        status=JobStatus.PENDING,
        config=config,
        created_at=datetime.utcnow()
    )
    
    db.save_job(job)
    return job


def start_job(
    job_id: str,
    progress_callback: Optional[Callable[[str, OptimizationProgress], None]] = None
) -> JobMetadata:
    """Start a pending job."""
    job = db.get_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")
    
    if job.status != JobStatus.PENDING:
        raise ValueError(f"Job {job_id} is not pending (status: {job.status})")
    
    # Get dataset
    dataset = db.get_dataset(job.dataset_id)
    if not dataset:
        raise ValueError(f"Dataset {job.dataset_id} not found")
    
    metadata, vrp_data = dataset
    
    # Create runner
    runner = JobRunner(
        job_id=job_id,
        dataset_id=job.dataset_id,
        config=job.config,
        vrp_data=vrp_data,
        progress_callback=progress_callback
    )
    
    # Track active job
    with _jobs_lock:
        _active_jobs[job_id] = runner
    
    # Submit to executor
    runner._future = _executor.submit(runner.run)
    
    return job


def run_job_sync(
    job_id: str,
    progress_callback: Optional[Callable[[str, OptimizationProgress], None]] = None
) -> JobResult:
    """Run a job synchronously and return the result."""
    job = db.get_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")
    
    if job.status == JobStatus.COMPLETED:
        result = db.get_job_result(job_id)
        if result:
            return result
    
    # Get dataset
    dataset = db.get_dataset(job.dataset_id)
    if not dataset:
        raise ValueError(f"Dataset {job.dataset_id} not found")
    
    metadata, vrp_data = dataset
    
    # Create runner
    runner = JobRunner(
        job_id=job_id,
        dataset_id=job.dataset_id,
        config=job.config,
        vrp_data=vrp_data,
        progress_callback=progress_callback
    )
    
    # Track active job
    with _jobs_lock:
        _active_jobs[job_id] = runner
    
    # Run synchronously
    result = runner.run()
    if result is None:
        raise RuntimeError("Job was cancelled")
    
    return result


def cancel_job(job_id: str) -> bool:
    """Cancel a running job."""
    with _jobs_lock:
        runner = _active_jobs.get(job_id)
        if runner:
            runner.cancel()
            return True
    
    # Also update status if not yet updated
    job = db.get_job(job_id)
    if job and job.status in (JobStatus.PENDING, JobStatus.RUNNING):
        db.update_job_status(job_id, JobStatus.CANCELLED)
        return True
    
    return False


def get_job_status(job_id: str) -> Optional[JobMetadata]:
    """Get the current status of a job."""
    return db.get_job(job_id)


def get_job_result(job_id: str) -> Optional[JobResult]:
    """Get the result of a completed job."""
    return db.get_job_result(job_id)


def is_job_active(job_id: str) -> bool:
    """Check if a job is currently running."""
    with _jobs_lock:
        return job_id in _active_jobs


async def run_optimization_async(
    vrp_data: VRPData,
    config: OptimizationConfig,
    progress_callback: Optional[Callable[[OptimizationProgress], None]] = None
) -> OptimizationResult:
    """
    Run optimization asynchronously without creating a persistent job.
    Used for WebSocket real-time optimization.
    """
    loop = asyncio.get_event_loop()
    
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
    
    # Run in thread pool
    def run_opt():
        return optimizer.optimize(
            progress_callback=progress_callback,
            progress_interval=1  # More frequent updates for real-time
        )
    
    result = await loop.run_in_executor(_executor, run_opt)
    return result
