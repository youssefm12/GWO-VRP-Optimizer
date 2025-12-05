"""
Tests for database operations.
"""
import pytest
import os
import tempfile
from datetime import datetime

# Set test database path before importing
os.environ["VRP_DATABASE_PATH"] = tempfile.mktemp(suffix=".db")

from app import database as db
from app.models import (
    DatasetMetadata, DatasetFormat, VRPData, Customer, Coordinate,
    JobMetadata, JobStatus, JobResult, OptimizationConfig, RouteInfo
)


@pytest.fixture(autouse=True)
def setup_db():
    """Setup fresh database for each test."""
    db.init_db()
    yield
    # Cleanup
    try:
        os.unlink(db.get_db_path())
    except Exception:
        pass


class TestDatasetOperations:
    def test_save_and_get_dataset(self):
        vrp_data = VRPData(
            depot=Coordinate(lat=0, lng=0),
            customers=[
                Customer(id=1, lat=1, lng=1, demand=10),
                Customer(id=2, lat=2, lng=2, demand=20),
            ]
        )
        
        metadata = DatasetMetadata(
            id="test-1",
            name="Test Dataset",
            description="A test dataset",
            format=DatasetFormat.JSON,
            num_customers=2,
            num_depots=1,
            total_demand=30,
            created_at=datetime.utcnow()
        )
        
        db.save_dataset(metadata, vrp_data)
        
        result = db.get_dataset("test-1")
        assert result is not None
        
        loaded_meta, loaded_data = result
        assert loaded_meta.name == "Test Dataset"
        assert loaded_meta.num_customers == 2
        assert len(loaded_data.customers) == 2
    
    def test_list_datasets(self):
        for i in range(3):
            vrp_data = VRPData(
                depot=Coordinate(lat=0, lng=0),
                customers=[Customer(id=1, lat=1, lng=1, demand=10)]
            )
            metadata = DatasetMetadata(
                id=f"test-{i}",
                name=f"Dataset {i}",
                format=DatasetFormat.JSON,
                num_customers=1,
                total_demand=10,
                created_at=datetime.utcnow()
            )
            db.save_dataset(metadata, vrp_data)
        
        datasets, total = db.list_datasets()
        assert total == 3
        assert len(datasets) == 3
    
    def test_delete_dataset(self):
        vrp_data = VRPData(
            depot=Coordinate(lat=0, lng=0),
            customers=[]
        )
        metadata = DatasetMetadata(
            id="to-delete",
            name="To Delete",
            format=DatasetFormat.JSON,
            num_customers=0,
            total_demand=0,
            created_at=datetime.utcnow()
        )
        db.save_dataset(metadata, vrp_data)
        
        assert db.get_dataset("to-delete") is not None
        
        db.delete_dataset("to-delete")
        
        assert db.get_dataset("to-delete") is None


class TestJobOperations:
    def create_test_dataset(self):
        vrp_data = VRPData(
            depot=Coordinate(lat=0, lng=0),
            customers=[Customer(id=1, lat=1, lng=1, demand=10)]
        )
        metadata = DatasetMetadata(
            id="job-test-dataset",
            name="Job Test Dataset",
            format=DatasetFormat.JSON,
            num_customers=1,
            total_demand=10,
            created_at=datetime.utcnow()
        )
        db.save_dataset(metadata, vrp_data)
        return metadata.id
    
    def test_save_and_get_job(self):
        dataset_id = self.create_test_dataset()
        
        job = JobMetadata(
            id="job-1",
            dataset_id=dataset_id,
            name="Test Job",
            status=JobStatus.PENDING,
            config=OptimizationConfig(
                numWolves=20,
                numIterations=50,
                vehicleCapacity=100
            ),
            created_at=datetime.utcnow()
        )
        
        db.save_job(job)
        
        loaded = db.get_job("job-1")
        assert loaded is not None
        assert loaded.name == "Test Job"
        assert loaded.status == JobStatus.PENDING
        assert loaded.config.numWolves == 20
    
    def test_update_job_status(self):
        dataset_id = self.create_test_dataset()
        
        job = JobMetadata(
            id="job-status",
            dataset_id=dataset_id,
            status=JobStatus.PENDING,
            config=OptimizationConfig(),
            created_at=datetime.utcnow()
        )
        db.save_job(job)
        
        db.update_job_status("job-status", JobStatus.RUNNING)
        
        updated = db.get_job("job-status")
        assert updated.status == JobStatus.RUNNING
        assert updated.started_at is not None
    
    def test_list_jobs_with_filter(self):
        dataset_id = self.create_test_dataset()
        
        for i, status in enumerate([JobStatus.PENDING, JobStatus.RUNNING, JobStatus.COMPLETED]):
            job = JobMetadata(
                id=f"job-filter-{i}",
                dataset_id=dataset_id,
                status=status,
                config=OptimizationConfig(),
                created_at=datetime.utcnow()
            )
            db.save_job(job)
        
        # Filter by status
        pending_jobs, count = db.list_jobs(status=JobStatus.PENDING)
        assert count == 1
        assert pending_jobs[0].status == JobStatus.PENDING


class TestJobResultOperations:
    def test_save_and_get_result(self):
        result = JobResult(
            job_id="result-test",
            routes=[[0, 1, 2, 0], [0, 3, 4, 0]],
            best_fitness=123.45,
            convergence_history=[
                {"iteration": 0, "fitness": 200.0},
                {"iteration": 10, "fitness": 150.0}
            ],
            runtime=2.5,
            route_details=[
                RouteInfo(route=[0, 1, 2, 0], distance=10.5, load=30),
                RouteInfo(route=[0, 3, 4, 0], distance=8.2, load=25)
            ]
        )
        
        db.save_job_result(result)
        
        loaded = db.get_job_result("result-test")
        assert loaded is not None
        assert loaded.best_fitness == 123.45
        assert len(loaded.routes) == 2
        assert len(loaded.route_details) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
