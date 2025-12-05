"""
Tests for the FastAPI endpoints.
"""
import pytest
import os
import tempfile
from fastapi.testclient import TestClient

# Set test database path before importing
os.environ["VRP_DATABASE_PATH"] = tempfile.mktemp(suffix=".db")

from app.main import app
from app import database as db


@pytest.fixture(autouse=True)
def setup_db():
    """Setup fresh database for each test."""
    db.init_db()
    yield
    try:
        os.unlink(db.get_db_path())
    except Exception:
        pass


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthCheck:
    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestDatasetEndpoints:
    def test_list_datasets_empty(self, client):
        response = client.get("/datasets")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["datasets"] == []
    
    def test_create_dataset(self, client):
        payload = {
            "name": "Test Dataset",
            "description": "A test",
            "vrp_data": {
                "depot": {"lat": 37.7749, "lng": -122.4194},
                "customers": [
                    {"id": 1, "lat": 37.78, "lng": -122.41, "demand": 10},
                    {"id": 2, "lat": 37.77, "lng": -122.42, "demand": 15}
                ]
            }
        }
        
        response = client.post("/datasets", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["metadata"]["name"] == "Test Dataset"
        assert data["metadata"]["num_customers"] == 2
        assert data["metadata"]["total_demand"] == 25
    
    def test_generate_dataset(self, client):
        payload = {
            "name": "Generated Test",
            "num_customers": 10,
            "demand_low": 5,
            "demand_high": 15,
            "seed": 42
        }
        
        response = client.post("/datasets/generate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["metadata"]["name"] == "Generated Test"
        assert data["metadata"]["num_customers"] == 10
        assert len(data["vrp_data"]["customers"]) == 10
    
    def test_get_dataset(self, client):
        # Create first
        payload = {
            "name": "Get Test",
            "vrp_data": {
                "depot": {"lat": 0, "lng": 0},
                "customers": [{"id": 1, "lat": 1, "lng": 1, "demand": 10}]
            }
        }
        create_resp = client.post("/datasets", json=payload)
        dataset_id = create_resp.json()["metadata"]["id"]
        
        # Get
        response = client.get(f"/datasets/{dataset_id}")
        assert response.status_code == 200
        assert response.json()["metadata"]["name"] == "Get Test"
    
    def test_delete_dataset(self, client):
        # Create
        payload = {
            "name": "Delete Test",
            "vrp_data": {
                "depot": {"lat": 0, "lng": 0},
                "customers": []
            }
        }
        create_resp = client.post("/datasets", json=payload)
        dataset_id = create_resp.json()["metadata"]["id"]
        
        # Delete
        response = client.delete(f"/datasets/{dataset_id}")
        assert response.status_code == 200
        
        # Verify deleted
        get_resp = client.get(f"/datasets/{dataset_id}")
        assert get_resp.status_code == 404


class TestJobEndpoints:
    def create_dataset(self, client):
        payload = {
            "name": "Job Test Dataset",
            "vrp_data": {
                "depot": {"lat": 0, "lng": 0},
                "customers": [
                    {"id": 1, "lat": 1, "lng": 0, "demand": 10},
                    {"id": 2, "lat": 0, "lng": 1, "demand": 10}
                ]
            }
        }
        response = client.post("/datasets", json=payload)
        return response.json()["metadata"]["id"]
    
    def test_create_job(self, client):
        dataset_id = self.create_dataset(client)
        
        payload = {
            "dataset_id": dataset_id,
            "config": {
                "numWolves": 10,
                "numIterations": 20,
                "vehicleCapacity": 50
            },
            "name": "Test Job"
        }
        
        response = client.post("/jobs", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["metadata"]["name"] == "Test Job"
        assert data["metadata"]["status"] == "pending"
    
    def test_run_job_sync(self, client):
        dataset_id = self.create_dataset(client)
        
        # Create job
        payload = {
            "dataset_id": dataset_id,
            "config": {
                "numWolves": 5,
                "numIterations": 10,
                "vehicleCapacity": 50
            }
        }
        create_resp = client.post("/jobs", json=payload)
        job_id = create_resp.json()["metadata"]["id"]
        
        # Run sync
        response = client.post(f"/jobs/{job_id}/run")
        assert response.status_code == 200
        
        data = response.json()
        assert data["metadata"]["status"] == "completed"
        assert data["result"] is not None
        assert len(data["result"]["routes"]) > 0
    
    def test_list_jobs(self, client):
        dataset_id = self.create_dataset(client)
        
        for i in range(3):
            client.post("/jobs", json={
                "dataset_id": dataset_id,
                "config": {"numWolves": 10, "numIterations": 10, "vehicleCapacity": 50}
            })
        
        response = client.get("/jobs")
        assert response.status_code == 200
        assert response.json()["total"] == 3


class TestDirectOptimization:
    def test_optimize_sync(self, client):
        payload = {
            "config": {
                "numWolves": 5,
                "numIterations": 10,
                "vehicleCapacity": 50
            },
            "vrpData": {
                "depot": {"lat": 0, "lng": 0},
                "customers": [
                    {"id": 1, "lat": 1, "lng": 0, "demand": 10},
                    {"id": 2, "lat": 0, "lng": 1, "demand": 10}
                ]
            }
        }
        
        response = client.post("/optimize_sync", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "routes" in data
        assert "best_fitness" in data
        assert "convergence_history" in data
        assert data["best_fitness"] > 0
    
    def test_generate_instance(self, client):
        response = client.post("/generate_instance", json={"num_customers": 15})
        assert response.status_code == 200
        
        data = response.json()
        assert "depot" in data
        assert "customers" in data
        assert len(data["customers"]) == 15


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
