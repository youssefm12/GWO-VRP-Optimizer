"""
VRP data generator for creating synthetic datasets.
"""
import numpy as np
from typing import Optional, Tuple, List
import uuid
from datetime import datetime

from .models import (
    DatasetMetadata, DatasetFormat, VRPData, Customer, Coordinate, Depot,
    DatasetGenerateRequest
)
from . import database as db


def generate_vrp_data(
    num_customers: int = 20,
    center_lat: float = 37.7749,
    center_lng: float = -122.4194,
    spread: float = 0.1,
    demand_low: int = 1,
    demand_high: int = 10,
    seed: Optional[int] = None
) -> Tuple[VRPData, int]:
    """
    Generate synthetic VRP data.
    
    Args:
        num_customers: Number of customers to generate.
        center_lat: Center latitude for depot.
        center_lng: Center longitude for depot.
        spread: Spread factor for customer locations (in degrees).
        demand_low: Minimum demand.
        demand_high: Maximum demand.
        seed: Random seed for reproducibility.
    
    Returns:
        Tuple of (VRPData, total_demand)
    """
    rng = np.random.default_rng(seed)
    
    # Depot at center
    depot = Coordinate(lat=center_lat, lng=center_lng)
    
    # Generate customers around depot
    customers = []
    total_demand = 0
    
    for i in range(1, num_customers + 1):
        lat = center_lat + (rng.random() - 0.5) * 2 * spread
        lng = center_lng + (rng.random() - 0.5) * 2 * spread
        demand = int(rng.integers(demand_low, demand_high + 1))
        
        customers.append(Customer(
            id=i,
            lat=round(lat, 6),
            lng=round(lng, 6),
            demand=demand
        ))
        total_demand += demand
    
    vrp_data = VRPData(
        depot=depot,
        depots=[Depot(id=0, lat=center_lat, lng=center_lng, name="Main Depot")],
        customers=customers
    )
    
    return vrp_data, total_demand


def generate_clustered_vrp_data(
    num_customers: int = 30,
    num_clusters: int = 3,
    center_lat: float = 37.7749,
    center_lng: float = -122.4194,
    cluster_spread: float = 0.05,
    overall_spread: float = 0.15,
    demand_low: int = 5,
    demand_high: int = 20,
    seed: Optional[int] = None
) -> Tuple[VRPData, int]:
    """
    Generate clustered VRP data (customers grouped in clusters).
    
    Args:
        num_customers: Total number of customers.
        num_clusters: Number of clusters.
        center_lat: Center latitude for depot.
        center_lng: Center longitude for depot.
        cluster_spread: Spread within each cluster.
        overall_spread: Spread for cluster centers.
        demand_low: Minimum demand.
        demand_high: Maximum demand.
        seed: Random seed.
    
    Returns:
        Tuple of (VRPData, total_demand)
    """
    rng = np.random.default_rng(seed)
    
    # Depot at center
    depot = Coordinate(lat=center_lat, lng=center_lng)
    
    # Generate cluster centers
    cluster_centers = []
    for _ in range(num_clusters):
        c_lat = center_lat + (rng.random() - 0.5) * 2 * overall_spread
        c_lng = center_lng + (rng.random() - 0.5) * 2 * overall_spread
        cluster_centers.append((c_lat, c_lng))
    
    # Distribute customers to clusters
    customers_per_cluster = num_customers // num_clusters
    extra = num_customers % num_clusters
    
    customers = []
    total_demand = 0
    customer_id = 1
    
    for i, (c_lat, c_lng) in enumerate(cluster_centers):
        n_cust = customers_per_cluster + (1 if i < extra else 0)
        
        for _ in range(n_cust):
            lat = c_lat + (rng.random() - 0.5) * 2 * cluster_spread
            lng = c_lng + (rng.random() - 0.5) * 2 * cluster_spread
            demand = int(rng.integers(demand_low, demand_high + 1))
            
            customers.append(Customer(
                id=customer_id,
                lat=round(lat, 6),
                lng=round(lng, 6),
                demand=demand
            ))
            total_demand += demand
            customer_id += 1
    
    vrp_data = VRPData(
        depot=depot,
        depots=[Depot(id=0, lat=center_lat, lng=center_lng, name="Main Depot")],
        customers=customers
    )
    
    return vrp_data, total_demand


def create_generated_dataset(request: DatasetGenerateRequest) -> Tuple[DatasetMetadata, VRPData]:
    """
    Create and save a generated dataset.
    
    Args:
        request: Generation request parameters.
    
    Returns:
        Tuple of (DatasetMetadata, VRPData)
    """
    vrp_data, total_demand = generate_vrp_data(
        num_customers=request.num_customers,
        center_lat=request.center_lat,
        center_lng=request.center_lng,
        spread=request.spread,
        demand_low=request.demand_low,
        demand_high=request.demand_high,
        seed=request.seed
    )
    
    metadata = DatasetMetadata(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description or f"Generated dataset with {request.num_customers} customers",
        format=DatasetFormat.GENERATED,
        num_customers=request.num_customers,
        num_depots=1,
        total_demand=total_demand,
        created_at=datetime.utcnow()
    )
    
    db.save_dataset(metadata, vrp_data)
    
    return metadata, vrp_data


def regenerate_instance(num_customers: int, seed: Optional[int] = None) -> VRPData:
    """
    Generate a new VRP instance without saving to database.
    Quick helper for the frontend regenerate feature.
    """
    vrp_data, _ = generate_vrp_data(
        num_customers=num_customers,
        seed=seed
    )
    return vrp_data
