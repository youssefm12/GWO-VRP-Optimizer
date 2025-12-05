"""
SQLite database management for datasets and jobs.
"""
import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import contextmanager

from .models import (
    DatasetMetadata, DatasetFormat, VRPData, Customer, Coordinate, Depot,
    JobMetadata, JobStatus, JobResult, OptimizationConfig, RouteInfo
)


DATABASE_PATH = os.environ.get("VRP_DATABASE_PATH", "vrp_data.db")


def get_db_path():
    """Get the database path, creating directory if needed."""
    db_dir = os.path.dirname(DATABASE_PATH) if os.path.dirname(DATABASE_PATH) else "."
    if db_dir != "." and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    return DATABASE_PATH


@contextmanager
def get_connection():
    """Context manager for database connections."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize the database schema."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Datasets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                format TEXT NOT NULL,
                num_customers INTEGER NOT NULL,
                num_depots INTEGER DEFAULT 1,
                total_demand INTEGER NOT NULL,
                file_path TEXT,
                vrp_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        
        # Jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                dataset_id TEXT NOT NULL,
                name TEXT,
                status TEXT NOT NULL,
                config TEXT NOT NULL,
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                error_message TEXT,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id)
            )
        """)
        
        # Job results table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_results (
                job_id TEXT PRIMARY KEY,
                routes TEXT NOT NULL,
                best_fitness REAL NOT NULL,
                convergence_history TEXT NOT NULL,
                runtime REAL NOT NULL,
                route_details TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_dataset ON jobs(dataset_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets(name)")


# --- Dataset Operations ---

def save_dataset(metadata: DatasetMetadata, vrp_data: VRPData) -> DatasetMetadata:
    """Save a dataset to the database."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO datasets 
            (id, name, description, format, num_customers, num_depots, total_demand, file_path, vrp_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            metadata.id,
            metadata.name,
            metadata.description,
            metadata.format.value,
            metadata.num_customers,
            metadata.num_depots,
            metadata.total_demand,
            metadata.file_path,
            vrp_data.model_dump_json(),
            metadata.created_at.isoformat(),
            datetime.utcnow().isoformat() if metadata.updated_at else None
        ))
    return metadata


def get_dataset(dataset_id: str) -> Optional[tuple[DatasetMetadata, VRPData]]:
    """Get a dataset by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return _row_to_dataset(row)


def get_dataset_by_name(name: str) -> Optional[tuple[DatasetMetadata, VRPData]]:
    """Get a dataset by name."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets WHERE name = ?", (name,))
        row = cursor.fetchone()
        if not row:
            return None
        return _row_to_dataset(row)


def list_datasets(skip: int = 0, limit: int = 100) -> tuple[List[DatasetMetadata], int]:
    """List all datasets with pagination."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM datasets")
        total = cursor.fetchone()[0]
        
        cursor.execute(
            "SELECT * FROM datasets ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, skip)
        )
        rows = cursor.fetchall()
        datasets = [_row_to_metadata(row) for row in rows]
    return datasets, total


def delete_dataset(dataset_id: str) -> bool:
    """Delete a dataset and its associated jobs."""
    with get_connection() as conn:
        cursor = conn.cursor()
        # Delete associated job results first
        cursor.execute("""
            DELETE FROM job_results WHERE job_id IN 
            (SELECT id FROM jobs WHERE dataset_id = ?)
        """, (dataset_id,))
        # Delete associated jobs
        cursor.execute("DELETE FROM jobs WHERE dataset_id = ?", (dataset_id,))
        # Delete dataset
        cursor.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        return cursor.rowcount > 0


def _row_to_metadata(row: sqlite3.Row) -> DatasetMetadata:
    """Convert a database row to DatasetMetadata."""
    return DatasetMetadata(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        format=DatasetFormat(row["format"]),
        num_customers=row["num_customers"],
        num_depots=row["num_depots"],
        total_demand=row["total_demand"],
        file_path=row["file_path"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None
    )


def _row_to_dataset(row: sqlite3.Row) -> tuple[DatasetMetadata, VRPData]:
    """Convert a database row to DatasetMetadata and VRPData."""
    metadata = _row_to_metadata(row)
    vrp_data = VRPData.model_validate_json(row["vrp_data"])
    return metadata, vrp_data


# --- Job Operations ---

def save_job(job: JobMetadata) -> JobMetadata:
    """Save a job to the database."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO jobs 
            (id, dataset_id, name, status, config, created_at, started_at, completed_at, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job.id,
            job.dataset_id,
            job.name,
            job.status.value,
            job.config.model_dump_json(),
            job.created_at.isoformat(),
            job.started_at.isoformat() if job.started_at else None,
            job.completed_at.isoformat() if job.completed_at else None,
            job.error_message
        ))
    return job


def get_job(job_id: str) -> Optional[JobMetadata]:
    """Get a job by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return _row_to_job(row)


def list_jobs(
    dataset_id: Optional[str] = None,
    status: Optional[JobStatus] = None,
    skip: int = 0,
    limit: int = 100
) -> tuple[List[JobMetadata], int]:
    """List jobs with optional filtering and pagination."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        where_clauses = []
        params = []
        
        if dataset_id:
            where_clauses.append("dataset_id = ?")
            params.append(dataset_id)
        if status:
            where_clauses.append("status = ?")
            params.append(status.value)
        
        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
        
        cursor.execute(f"SELECT COUNT(*) FROM jobs WHERE {where_sql}", params)
        total = cursor.fetchone()[0]
        
        cursor.execute(
            f"SELECT * FROM jobs WHERE {where_sql} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [limit, skip]
        )
        rows = cursor.fetchall()
        jobs = [_row_to_job(row) for row in rows]
    return jobs, total


def update_job_status(
    job_id: str,
    status: JobStatus,
    error_message: Optional[str] = None
) -> Optional[JobMetadata]:
    """Update job status."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        now = datetime.utcnow().isoformat()
        
        if status == JobStatus.RUNNING:
            cursor.execute(
                "UPDATE jobs SET status = ?, started_at = ? WHERE id = ?",
                (status.value, now, job_id)
            )
        elif status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            cursor.execute(
                "UPDATE jobs SET status = ?, completed_at = ?, error_message = ? WHERE id = ?",
                (status.value, now, error_message, job_id)
            )
        else:
            cursor.execute(
                "UPDATE jobs SET status = ? WHERE id = ?",
                (status.value, job_id)
            )
    
    return get_job(job_id)


def delete_job(job_id: str) -> bool:
    """Delete a job and its result."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM job_results WHERE job_id = ?", (job_id,))
        cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        return cursor.rowcount > 0


def _row_to_job(row: sqlite3.Row) -> JobMetadata:
    """Convert a database row to JobMetadata."""
    return JobMetadata(
        id=row["id"],
        dataset_id=row["dataset_id"],
        name=row["name"],
        status=JobStatus(row["status"]),
        config=OptimizationConfig.model_validate_json(row["config"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        started_at=datetime.fromisoformat(row["started_at"]) if row["started_at"] else None,
        completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None,
        error_message=row["error_message"]
    )


# --- Job Results Operations ---

def save_job_result(result: JobResult) -> JobResult:
    """Save a job result to the database."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO job_results 
            (job_id, routes, best_fitness, convergence_history, runtime, route_details)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            result.job_id,
            json.dumps(result.routes),
            result.best_fitness,
            json.dumps(result.convergence_history),
            result.runtime,
            json.dumps([rd.model_dump() for rd in result.route_details]) if result.route_details else None
        ))
    return result


def get_job_result(job_id: str) -> Optional[JobResult]:
    """Get a job result by job ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM job_results WHERE job_id = ?", (job_id,))
        row = cursor.fetchone()
        if not row:
            return None
        
        route_details = None
        if row["route_details"]:
            route_details = [RouteInfo(**rd) for rd in json.loads(row["route_details"])]
        
        return JobResult(
            job_id=row["job_id"],
            routes=json.loads(row["routes"]),
            best_fitness=row["best_fitness"],
            convergence_history=json.loads(row["convergence_history"]),
            runtime=row["runtime"],
            route_details=route_details
        )
