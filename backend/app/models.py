"""
Pydantic models and database models for the VRP optimization backend.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DatasetFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    VRP = "vrp"
    TSPLIB = "tsplib"
    GENERATED = "generated"


# --- Request/Response Models ---

class Coordinate(BaseModel):
    lat: float
    lng: float


class Customer(BaseModel):
    id: int
    lat: float
    lng: float
    demand: int


class Depot(BaseModel):
    id: Optional[int] = 0
    lat: float
    lng: float
    name: Optional[str] = "Depot"


class VRPData(BaseModel):
    depot: Coordinate
    depots: Optional[List[Depot]] = None
    customers: List[Customer]


class OptimizationConfig(BaseModel):
    numWolves: int = Field(default=30, ge=5, le=200)
    numIterations: int = Field(default=100, ge=10, le=1000)
    randomSeed: Optional[int] = 42
    vehicleCapacity: int = Field(default=100, ge=1)
    penaltyCoefficient: float = Field(default=1000.0, ge=0)


class OptimizationRequest(BaseModel):
    config: OptimizationConfig
    vrpData: VRPData


class RouteInfo(BaseModel):
    route: List[int]
    distance: float
    load: int


class OptimizationResponse(BaseModel):
    routes: List[List[int]]
    best_fitness: float
    convergence_history: List[Dict[str, float]]
    runtime: float
    route_details: Optional[List[RouteInfo]] = None


class ProgressUpdate(BaseModel):
    iter: int
    best_fitness: float
    current_alpha: Optional[List[float]] = None


class FinalResult(BaseModel):
    done: bool = True
    routes: List[List[int]]
    best_fitness: float
    runtime: float
    route_details: Optional[List[RouteInfo]] = None


# --- Dataset Models ---

class DatasetMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    format: DatasetFormat
    num_customers: int
    num_depots: int = 1
    total_demand: int
    file_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    vrp_data: VRPData


class DatasetGenerateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    num_customers: int = Field(default=20, ge=3, le=500)
    area_size: float = Field(default=100.0, ge=10)
    demand_low: int = Field(default=1, ge=1)
    demand_high: int = Field(default=10, ge=1)
    seed: Optional[int] = None
    center_lat: float = Field(default=37.7749)
    center_lng: float = Field(default=-122.4194)
    spread: float = Field(default=0.1)


class DatasetResponse(BaseModel):
    metadata: DatasetMetadata
    vrp_data: VRPData


class DatasetListResponse(BaseModel):
    datasets: List[DatasetMetadata]
    total: int


# --- Job Models ---

class JobCreate(BaseModel):
    dataset_id: str
    config: OptimizationConfig
    name: Optional[str] = None


class JobMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dataset_id: str
    name: Optional[str] = None
    status: JobStatus = JobStatus.PENDING
    config: OptimizationConfig
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class JobResult(BaseModel):
    job_id: str
    routes: List[List[int]]
    best_fitness: float
    convergence_history: List[Dict[str, float]]
    runtime: float
    route_details: Optional[List[RouteInfo]] = None


class JobResponse(BaseModel):
    metadata: JobMetadata
    result: Optional[JobResult] = None


class JobListResponse(BaseModel):
    jobs: List[JobMetadata]
    total: int


# --- Scan/Ingest Models ---

class ScanResult(BaseModel):
    path: str
    format: DatasetFormat
    name: str
    num_customers: int
    num_depots: int
    total_demand: int
    valid: bool
    error: Optional[str] = None


class ScanResponse(BaseModel):
    scanned_paths: List[str]
    found_datasets: List[ScanResult]
    total_found: int
    total_valid: int


class IngestRequest(BaseModel):
    paths: List[str]
    overwrite: bool = False


class IngestResponse(BaseModel):
    ingested: List[DatasetMetadata]
    failed: List[Dict[str, str]]
    total_ingested: int
    total_failed: int
