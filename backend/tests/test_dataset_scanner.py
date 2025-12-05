"""
Tests for dataset scanner and parser.
"""
import pytest
import os
import tempfile
import json
import csv
import atexit

os.environ["VRP_DATABASE_PATH"] = tempfile.mktemp(suffix=".db")

from app.dataset_scanner import DatasetScanner, DatasetParser
from app.models import DatasetFormat
from app import database as db


# Track temp files to clean up
_temp_files = []


def cleanup_temp_files():
    for f in _temp_files:
        try:
            os.unlink(f)
        except Exception:
            pass


atexit.register(cleanup_temp_files)


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()
    yield
    try:
        os.unlink(db.get_db_path())
    except Exception:
        pass


class TestDatasetParser:
    def test_detect_csv_format(self):
        fd, path = tempfile.mkstemp(suffix=".csv")
        _temp_files.append(path)
        with os.fdopen(fd, 'wb') as f:
            f.write(b"id,x,y,demand\n0,0,0,0\n")
        fmt = DatasetParser.detect_format(path)
        assert fmt == DatasetFormat.CSV
    
    def test_detect_json_format(self):
        fd, path = tempfile.mkstemp(suffix=".json")
        _temp_files.append(path)
        with os.fdopen(fd, 'wb') as f:
            f.write(b'{"depot": {}}')
        fmt = DatasetParser.detect_format(path)
        assert fmt == DatasetFormat.JSON
    
    def test_parse_csv(self):
        fd, path = tempfile.mkstemp(suffix=".csv")
        _temp_files.append(path)
        with os.fdopen(fd, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'lat', 'lng', 'demand'])
            writer.writerow([0, 0.0, 0.0, 0])  # depot
            writer.writerow([1, 1.0, 1.0, 10])
            writer.writerow([2, 2.0, 2.0, 20])
        
        vrp_data, meta = DatasetParser.parse_csv(path)
        
        assert vrp_data.depot.lat == 0.0
        assert len(vrp_data.customers) == 2
        assert meta["num_customers"] == 2
        assert meta["total_demand"] == 30
    
    def test_parse_json(self):
        data = {
            "depot": {"lat": 10.0, "lng": 20.0},
            "customers": [
                {"id": 1, "lat": 11.0, "lng": 21.0, "demand": 5},
                {"id": 2, "lat": 12.0, "lng": 22.0, "demand": 15}
            ]
        }
        
        fd, path = tempfile.mkstemp(suffix=".json")
        _temp_files.append(path)
        with os.fdopen(fd, 'w') as f:
            json.dump(data, f)
        
        vrp_data, meta = DatasetParser.parse_json(path)
        
        assert vrp_data.depot.lat == 10.0
        assert vrp_data.depot.lng == 20.0
        assert len(vrp_data.customers) == 2
        assert meta["total_demand"] == 20
    
    def test_parse_tsplib_format(self):
        content = """NAME : test
TYPE : CVRP
DIMENSION : 4
CAPACITY : 100
NODE_COORD_SECTION
1 0 0
2 1 1
3 2 2
4 3 3
DEMAND_SECTION
1 0
2 10
3 20
4 30
DEPOT_SECTION
1
-1
EOF
"""
        fd, path = tempfile.mkstemp(suffix=".vrp")
        _temp_files.append(path)
        with os.fdopen(fd, 'w') as f:
            f.write(content)
        
        vrp_data, meta = DatasetParser.parse_tsplib(path)
        
        assert vrp_data.depot.lat == 0.0  # Node 1 is depot
        assert len(vrp_data.customers) == 3
        assert meta["total_demand"] == 60


class TestDatasetScanner:
    def test_scan_directory(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test files
            csv_path = os.path.join(tmpdir, "test.csv")
            with open(csv_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['id', 'lat', 'lng', 'demand'])
                writer.writerow([0, 0, 0, 0])
                writer.writerow([1, 1, 1, 10])
            
            json_path = os.path.join(tmpdir, "test.json")
            with open(json_path, 'w') as f:
                json.dump({
                    "depot": {"lat": 0, "lng": 0},
                    "customers": [{"id": 1, "lat": 1, "lng": 1, "demand": 5}]
                }, f)
            
            scanner = DatasetScanner(tmpdir)
            result = scanner.scan([tmpdir])
            
            assert result.total_found >= 2
            assert result.total_valid >= 2
    
    def test_ingest_datasets(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test file
            json_path = os.path.join(tmpdir, "ingest_test.json")
            with open(json_path, 'w') as f:
                json.dump({
                    "depot": {"lat": 0, "lng": 0},
                    "customers": [{"id": 1, "lat": 1, "lng": 1, "demand": 5}]
                }, f)
            
            scanner = DatasetScanner(tmpdir)
            result = scanner.ingest([json_path])
            
            assert result.total_ingested == 1
            assert result.total_failed == 0
            
            # Verify in database
            datasets, total = db.list_datasets()
            assert total == 1
            assert datasets[0].name == "ingest_test"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
