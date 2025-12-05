"""
Tests for the GWO optimizer module.
"""
import pytest
import numpy as np
from app.gwo_optimizer import (
    GreyWolfOptimizer, VRPOptimizer, 
    decode_random_keys, fitness_from_routes, euclidean,
    OptimizationProgress
)


class TestEuclidean:
    def test_same_point(self):
        assert euclidean((0, 0), (0, 0)) == 0.0
    
    def test_horizontal_distance(self):
        assert euclidean((0, 0), (3, 0)) == 3.0
    
    def test_vertical_distance(self):
        assert euclidean((0, 0), (0, 4)) == 4.0
    
    def test_diagonal_distance(self):
        assert euclidean((0, 0), (3, 4)) == 5.0  # 3-4-5 triangle


class TestDecodeRandomKeys:
    def test_single_route(self):
        """All customers fit in one vehicle."""
        x = np.array([0.1, 0.5, 0.3])  # Order: 0, 2, 1
        coords = [(0, 0), (1, 0), (2, 0), (3, 0)]  # depot + 3 customers
        demands = [0, 5, 5, 5]
        capacity = 20
        
        routes = decode_random_keys(x, 0, coords, demands, capacity)
        
        assert len(routes) == 1
        assert routes[0][0] == 0  # starts at depot
        assert routes[0][-1] == 0  # ends at depot
        assert set(routes[0][1:-1]) == {1, 2, 3}  # all customers visited
    
    def test_multiple_routes(self):
        """Customers split across vehicles due to capacity."""
        x = np.array([0.1, 0.5, 0.3, 0.2])
        coords = [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)]
        demands = [0, 10, 10, 10, 10]
        capacity = 25
        
        routes = decode_random_keys(x, 0, coords, demands, capacity)
        
        assert len(routes) >= 2
        all_customers = set()
        for route in routes:
            assert route[0] == 0
            assert route[-1] == 0
            for c in route[1:-1]:
                all_customers.add(c)
        assert all_customers == {1, 2, 3, 4}


class TestFitnessFromRoutes:
    def test_simple_route(self):
        routes = [[0, 1, 0]]  # depot -> customer 1 -> depot
        coords = [(0, 0), (3, 4)]
        demands = [0, 5]
        capacity = 10
        
        fitness = fitness_from_routes(routes, coords, demands, capacity)
        
        expected = 2 * 5.0  # distance to customer and back
        assert fitness == expected
    
    def test_capacity_violation(self):
        routes = [[0, 1, 2, 0]]
        coords = [(0, 0), (1, 0), (2, 0)]
        demands = [0, 15, 15]  # total 30
        capacity = 20  # violation of 10
        penalty = 1000.0
        
        fitness = fitness_from_routes(routes, coords, demands, capacity, penalty)
        
        # Should include penalty
        assert fitness > 4.0  # just distance would be 4
        assert fitness >= 10 * penalty  # penalty for violation


class TestGreyWolfOptimizer:
    def test_simple_optimization(self):
        """Test GWO on a simple quadratic function."""
        def sphere(x):
            return np.sum(x ** 2)
        
        gwo = GreyWolfOptimizer(
            obj_func=sphere,
            dim=3,
            lb=[-5, -5, -5],
            ub=[5, 5, 5],
            population=10,
            max_iter=20,
            seed=42
        )
        
        best_solution, best_fitness, history = gwo.optimize()
        
        assert best_fitness < 1.0  # Should find near-optimal
        assert len(history) == 21  # initial + 20 iterations
    
    def test_progress_callback(self):
        """Test that progress callback is called."""
        def sphere(x):
            return np.sum(x ** 2)
        
        progress_calls = []
        
        def on_progress(progress: OptimizationProgress):
            progress_calls.append(progress)
        
        gwo = GreyWolfOptimizer(
            obj_func=sphere,
            dim=2,
            lb=[-5, -5],
            ub=[5, 5],
            population=5,
            max_iter=10,
            seed=42
        )
        
        gwo.optimize(progress_callback=on_progress, progress_interval=2)
        
        assert len(progress_calls) > 0


class TestVRPOptimizer:
    def test_basic_optimization(self):
        """Test VRP optimization with simple instance."""
        depot = (0, 0)
        customers = [
            {"id": 1, "lat": 1, "lng": 0, "demand": 5},
            {"id": 2, "lat": 0, "lng": 1, "demand": 5},
            {"id": 3, "lat": -1, "lng": 0, "demand": 5},
        ]
        
        optimizer = VRPOptimizer(
            depot=depot,
            customers=customers,
            vehicle_capacity=20,
            num_wolves=10,
            num_iterations=20,
            seed=42
        )
        
        result = optimizer.optimize()
        
        assert result.routes is not None
        assert len(result.routes) >= 1
        assert result.best_fitness > 0
        assert result.runtime > 0
        
        # Check all customers are visited
        visited = set()
        for route in result.routes:
            for c in route:
                if c != 0:
                    visited.add(c)
        assert visited == {1, 2, 3}
    
    def test_capacity_constraint(self):
        """Test that capacity constraint is respected."""
        depot = (0, 0)
        customers = [
            {"id": 1, "lat": 1, "lng": 0, "demand": 30},
            {"id": 2, "lat": 2, "lng": 0, "demand": 30},
            {"id": 3, "lat": 3, "lng": 0, "demand": 30},
        ]
        
        optimizer = VRPOptimizer(
            depot=depot,
            customers=customers,
            vehicle_capacity=50,
            num_wolves=10,
            num_iterations=30,
            seed=42
        )
        
        result = optimizer.optimize()
        
        # Should need at least 2 routes
        assert len(result.routes) >= 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
