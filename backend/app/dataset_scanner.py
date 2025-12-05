"""
Dataset scanner and ingestion module.
Scans directories for VRP data files and parses them into standardized format.
"""
import os
import json
import csv
import re
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
import uuid
from datetime import datetime

from .models import (
    DatasetMetadata, DatasetFormat, VRPData, Customer, Coordinate, Depot,
    ScanResult, ScanResponse, IngestResponse
)
from . import database as db


# Default directories to scan
DEFAULT_SCAN_DIRS = [
    "data",
    "datasets",
    "instances",
    "benchmarks",
    "vrp_instances",
]


class DatasetParser:
    """Parser for various VRP dataset formats."""
    
    @staticmethod
    def detect_format(file_path: str) -> Optional[DatasetFormat]:
        """Detect the format of a data file."""
        ext = Path(file_path).suffix.lower()
        name = Path(file_path).name.lower()
        
        if ext == ".csv":
            return DatasetFormat.CSV
        elif ext == ".json":
            return DatasetFormat.JSON
        elif ext == ".vrp":
            return DatasetFormat.VRP
        elif ext in (".txt", ".tsp") or "vrp" in name or "cvrp" in name:
            # Check if it's TSPLIB format
            try:
                with open(file_path, 'r') as f:
                    content = f.read(500)
                    if "NODE_COORD_SECTION" in content or "DIMENSION" in content:
                        return DatasetFormat.TSPLIB
            except Exception:
                pass
            return DatasetFormat.VRP
        return None
    
    @staticmethod
    def parse_csv(file_path: str, has_header: bool = True) -> Tuple[VRPData, Dict[str, Any]]:
        """
        Parse CSV file. Expected columns: id/idx, x/lat, y/lng, demand
        First row (after header) with demand=0 is treated as depot.
        """
        customers = []
        depot = None
        total_demand = 0
        
        with open(file_path, 'r', newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f) if has_header else csv.reader(f)
            
            for i, row in enumerate(reader):
                if has_header:
                    # Try different column name conventions
                    idx = int(row.get('id', row.get('idx', row.get('index', i))))
                    lat = float(row.get('lat', row.get('x', row.get('latitude', 0))))
                    lng = float(row.get('lng', row.get('y', row.get('longitude', 0))))
                    demand = int(float(row.get('demand', row.get('load', 0))))
                else:
                    idx, lat, lng, demand = int(row[0]), float(row[1]), float(row[2]), int(float(row[3]))
                
                if demand == 0 and depot is None:
                    depot = Coordinate(lat=lat, lng=lng)
                else:
                    customers.append(Customer(id=idx if idx > 0 else len(customers) + 1, lat=lat, lng=lng, demand=demand))
                    total_demand += demand
        
        if depot is None and customers:
            # Use first customer as depot
            first = customers.pop(0)
            depot = Coordinate(lat=first.lat, lng=first.lng)
        elif depot is None:
            depot = Coordinate(lat=0, lng=0)
        
        vrp_data = VRPData(depot=depot, customers=customers)
        meta = {
            "num_customers": len(customers),
            "num_depots": 1,
            "total_demand": total_demand
        }
        return vrp_data, meta
    
    @staticmethod
    def parse_json(file_path: str) -> Tuple[VRPData, Dict[str, Any]]:
        """Parse JSON file containing VRP data."""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle different JSON structures
        if "vrpData" in data:
            data = data["vrpData"]
        
        depot_data = data.get("depot", data.get("depots", [{}])[0] if "depots" in data else {})
        depot = Coordinate(
            lat=depot_data.get("lat", depot_data.get("x", 0)),
            lng=depot_data.get("lng", depot_data.get("y", 0))
        )
        
        customers = []
        total_demand = 0
        for c in data.get("customers", data.get("nodes", [])):
            if c.get("demand", c.get("load", 0)) > 0:  # Skip depot nodes
                cust = Customer(
                    id=c.get("id", len(customers) + 1),
                    lat=c.get("lat", c.get("x", 0)),
                    lng=c.get("lng", c.get("y", 0)),
                    demand=c.get("demand", c.get("load", 0))
                )
                customers.append(cust)
                total_demand += cust.demand
        
        vrp_data = VRPData(depot=depot, customers=customers)
        meta = {
            "num_customers": len(customers),
            "num_depots": 1,
            "total_demand": total_demand
        }
        return vrp_data, meta
    
    @staticmethod
    def parse_tsplib(file_path: str) -> Tuple[VRPData, Dict[str, Any]]:
        """Parse TSPLIB/CVRPLIB format files."""
        dimension = 0
        capacity = 0
        coords = {}
        demands = {}
        depot_section = []
        
        section = None
        
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                # Parse metadata
                if line.startswith("DIMENSION"):
                    dimension = int(line.split(":")[1].strip())
                elif line.startswith("CAPACITY"):
                    capacity = int(line.split(":")[1].strip())
                elif line == "NODE_COORD_SECTION":
                    section = "coords"
                elif line == "DEMAND_SECTION":
                    section = "demand"
                elif line == "DEPOT_SECTION":
                    section = "depot"
                elif line == "EOF":
                    break
                elif section == "coords":
                    parts = line.split()
                    if len(parts) >= 3:
                        idx = int(parts[0])
                        x = float(parts[1])
                        y = float(parts[2])
                        coords[idx] = (x, y)
                elif section == "demand":
                    parts = line.split()
                    if len(parts) >= 2:
                        idx = int(parts[0])
                        d = int(parts[1])
                        demands[idx] = d
                elif section == "depot":
                    try:
                        depot_idx = int(line)
                        if depot_idx > 0:
                            depot_section.append(depot_idx)
                    except ValueError:
                        pass
        
        # Build VRP data
        depot_indices = set(depot_section) if depot_section else {1}
        
        depot = None
        customers = []
        total_demand = 0
        
        for idx, (x, y) in coords.items():
            demand = demands.get(idx, 0)
            if idx in depot_indices or demand == 0:
                if depot is None:
                    depot = Coordinate(lat=x, lng=y)
            else:
                customers.append(Customer(id=idx, lat=x, lng=y, demand=demand))
                total_demand += demand
        
        if depot is None:
            depot = Coordinate(lat=0, lng=0)
        
        vrp_data = VRPData(depot=depot, customers=customers)
        meta = {
            "num_customers": len(customers),
            "num_depots": len(depot_indices),
            "total_demand": total_demand,
            "capacity": capacity
        }
        return vrp_data, meta
    
    @staticmethod
    def parse_vrp(file_path: str) -> Tuple[VRPData, Dict[str, Any]]:
        """Parse simple VRP format (similar to TSPLIB but simpler)."""
        # Try TSPLIB first
        try:
            return DatasetParser.parse_tsplib(file_path)
        except Exception:
            pass
        
        # Try simple format: each line is "id x y demand"
        coords = []
        demands = []
        
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                parts = line.split()
                if len(parts) >= 4:
                    coords.append((float(parts[1]), float(parts[2])))
                    demands.append(int(float(parts[3])))
                elif len(parts) >= 3:
                    coords.append((float(parts[0]), float(parts[1])))
                    demands.append(int(float(parts[2])) if len(parts) > 2 else 0)
        
        if not coords:
            raise ValueError("No valid coordinates found")
        
        depot = Coordinate(lat=coords[0][0], lng=coords[0][1])
        customers = []
        total_demand = 0
        
        for i, ((x, y), d) in enumerate(zip(coords[1:], demands[1:]), 1):
            if d > 0:
                customers.append(Customer(id=i, lat=x, lng=y, demand=d))
                total_demand += d
        
        vrp_data = VRPData(depot=depot, customers=customers)
        meta = {
            "num_customers": len(customers),
            "num_depots": 1,
            "total_demand": total_demand
        }
        return vrp_data, meta


class DatasetScanner:
    """Scanner for finding and ingesting VRP datasets."""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path).resolve()
        self.parser = DatasetParser()
    
    def scan(self, directories: Optional[List[str]] = None, recursive: bool = True) -> ScanResponse:
        """
        Scan directories for VRP data files.
        
        Args:
            directories: List of directories to scan. If None, uses defaults.
            recursive: Whether to scan subdirectories.
        
        Returns:
            ScanResponse with found datasets.
        """
        if directories is None:
            directories = [str(self.base_path)]
            # Also check default subdirectories
            for d in DEFAULT_SCAN_DIRS:
                check_path = self.base_path / d
                if check_path.exists():
                    directories.append(str(check_path))
        
        scanned_paths = []
        found_datasets = []
        
        for dir_path in directories:
            dir_path = Path(dir_path)
            if not dir_path.exists():
                continue
            
            scanned_paths.append(str(dir_path))
            
            pattern = "**/*" if recursive else "*"
            for file_path in dir_path.glob(pattern):
                if not file_path.is_file():
                    continue
                
                result = self._scan_file(file_path)
                if result:
                    found_datasets.append(result)
        
        total_valid = sum(1 for d in found_datasets if d.valid)
        
        return ScanResponse(
            scanned_paths=scanned_paths,
            found_datasets=found_datasets,
            total_found=len(found_datasets),
            total_valid=total_valid
        )
    
    def _scan_file(self, file_path: Path) -> Optional[ScanResult]:
        """Scan a single file and return scan result."""
        fmt = DatasetParser.detect_format(str(file_path))
        if fmt is None:
            return None
        
        try:
            vrp_data, meta = self._parse_file(str(file_path), fmt)
            return ScanResult(
                path=str(file_path),
                format=fmt,
                name=file_path.stem,
                num_customers=meta["num_customers"],
                num_depots=meta["num_depots"],
                total_demand=meta["total_demand"],
                valid=True
            )
        except Exception as e:
            return ScanResult(
                path=str(file_path),
                format=fmt,
                name=file_path.stem,
                num_customers=0,
                num_depots=0,
                total_demand=0,
                valid=False,
                error=str(e)
            )
    
    def _parse_file(self, file_path: str, fmt: DatasetFormat) -> Tuple[VRPData, Dict[str, Any]]:
        """Parse a file based on its format."""
        if fmt == DatasetFormat.CSV:
            return DatasetParser.parse_csv(file_path)
        elif fmt == DatasetFormat.JSON:
            return DatasetParser.parse_json(file_path)
        elif fmt == DatasetFormat.TSPLIB:
            return DatasetParser.parse_tsplib(file_path)
        elif fmt == DatasetFormat.VRP:
            return DatasetParser.parse_vrp(file_path)
        else:
            raise ValueError(f"Unsupported format: {fmt}")
    
    def ingest(self, paths: List[str], overwrite: bool = False) -> IngestResponse:
        """
        Ingest datasets from file paths into the database.
        
        Args:
            paths: List of file paths to ingest.
            overwrite: Whether to overwrite existing datasets with same name.
        
        Returns:
            IngestResponse with ingestion results.
        """
        ingested = []
        failed = []
        
        for path in paths:
            try:
                file_path = Path(path)
                if not file_path.exists():
                    failed.append({"path": path, "error": "File not found"})
                    continue
                
                fmt = DatasetParser.detect_format(str(file_path))
                if fmt is None:
                    failed.append({"path": path, "error": "Unsupported format"})
                    continue
                
                vrp_data, meta = self._parse_file(str(file_path), fmt)
                
                name = file_path.stem
                
                # Check for existing
                existing = db.get_dataset_by_name(name)
                if existing and not overwrite:
                    failed.append({"path": path, "error": f"Dataset '{name}' already exists"})
                    continue
                
                dataset_id = existing[0].id if existing else str(uuid.uuid4())
                
                metadata = DatasetMetadata(
                    id=dataset_id,
                    name=name,
                    description=f"Imported from {file_path.name}",
                    format=fmt,
                    num_customers=meta["num_customers"],
                    num_depots=meta["num_depots"],
                    total_demand=meta["total_demand"],
                    file_path=str(file_path),
                    created_at=datetime.utcnow() if not existing else existing[0].created_at,
                    updated_at=datetime.utcnow() if existing else None
                )
                
                db.save_dataset(metadata, vrp_data)
                ingested.append(metadata)
                
            except Exception as e:
                failed.append({"path": path, "error": str(e)})
        
        return IngestResponse(
            ingested=ingested,
            failed=failed,
            total_ingested=len(ingested),
            total_failed=len(failed)
        )
    
    def auto_ingest(self, directories: Optional[List[str]] = None) -> IngestResponse:
        """Scan and automatically ingest all valid datasets found."""
        scan_result = self.scan(directories)
        valid_paths = [d.path for d in scan_result.found_datasets if d.valid]
        return self.ingest(valid_paths, overwrite=False)
