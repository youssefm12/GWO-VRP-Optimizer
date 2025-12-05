"""
GWO Optimizer integration module.
Wraps the core GWO algorithm for use with the backend API.
"""
import numpy as np
from math import hypot
from typing import List, Tuple, Dict, Any, Optional, Callable
from dataclasses import dataclass
import time


@dataclass
class OptimizationProgress:
    """Progress update during optimization."""
    iteration: int
    best_fitness: float
    current_alpha: Optional[List[float]] = None


@dataclass
class OptimizationResult:
    """Final optimization result."""
    routes: List[List[int]]
    best_fitness: float
    convergence_history: List[Dict[str, float]]
    runtime: float
    route_details: List[Dict[str, Any]]


class GreyWolfOptimizer:
    """Grey Wolf Optimizer for VRP using random-key encoding."""
    
    def __init__(
        self,
        obj_func: Callable,
        dim: int,
        lb: np.ndarray,
        ub: np.ndarray,
        population: int = 30,
        max_iter: int = 100,
        seed: Optional[int] = None
    ):
        self.obj_func = obj_func
        self.dim = dim
        self.lb = np.array(lb)
        self.ub = np.array(ub)
        self.pop = population
        self.max_iter = max_iter
        self.rng = np.random.default_rng(seed)
        
        # State for async optimization
        self._cancelled = False
    
    def _init_population(self) -> np.ndarray:
        """Initialize the wolf population."""
        return self.rng.uniform(self.lb, self.ub, size=(self.pop, self.dim))
    
    def optimize(
        self,
        progress_callback: Optional[Callable[[OptimizationProgress], None]] = None,
        progress_interval: int = 5
    ) -> Tuple[np.ndarray, float, List[Dict[str, float]]]:
        """
        Run the GWO optimization.
        
        Args:
            progress_callback: Optional callback for progress updates.
            progress_interval: Interval for progress updates.
        
        Returns:
            Tuple of (best_solution, best_fitness, convergence_history)
        """
        X = self._init_population()
        fitness = np.apply_along_axis(self.obj_func, 1, X)
        idx = np.argsort(fitness)
        X = X[idx]
        fitness = fitness[idx]
        
        alpha, beta, delta = X[0].copy(), X[1].copy(), X[2].copy()
        alpha_fit, beta_fit, delta_fit = fitness[0], fitness[1], fitness[2]
        
        best_history = [{"iteration": 0, "fitness": float(alpha_fit)}]
        
        if progress_callback:
            progress_callback(OptimizationProgress(
                iteration=0,
                best_fitness=float(alpha_fit)
            ))
        
        for t in range(1, self.max_iter + 1):
            if self._cancelled:
                break
            
            a = 2 * (1 - t / self.max_iter)
            
            for i in range(self.pop):
                Xi = X[i].copy()
                components = np.zeros((3, self.dim))
                
                for j, leader in enumerate([alpha, beta, delta]):
                    r1 = self.rng.random(self.dim)
                    r2 = self.rng.random(self.dim)
                    A = 2 * a * r1 - a
                    C = 2 * r2
                    D = np.abs(C * leader - Xi)
                    components[j] = leader - A * D
                
                X[i] = np.mean(components, axis=0)
                X[i] = np.clip(X[i], self.lb, self.ub)
            
            fitness = np.apply_along_axis(self.obj_func, 1, X)
            idx = np.argsort(fitness)
            X = X[idx]
            fitness = fitness[idx]
            
            if fitness[0] < alpha_fit:
                alpha = X[0].copy()
                alpha_fit = fitness[0]
            beta = X[1].copy()
            beta_fit = fitness[1]
            delta = X[2].copy()
            delta_fit = fitness[2]
            
            best_history.append({"iteration": t, "fitness": float(alpha_fit)})
            
            if progress_callback and t % progress_interval == 0:
                progress_callback(OptimizationProgress(
                    iteration=t,
                    best_fitness=float(alpha_fit)
                ))
        
        return alpha, alpha_fit, best_history
    
    def cancel(self):
        """Cancel the optimization."""
        self._cancelled = True


def euclidean(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """Calculate Euclidean distance between two points."""
    return hypot(a[0] - b[0], a[1] - b[1])


def decode_random_keys(
    x: np.ndarray,
    depot_index: int,
    coords: List[Tuple[float, float]],
    demands: List[int],
    vehicle_capacity: int
) -> List[List[int]]:
    """
    Decode a random-key vector to VRP routes.
    
    Args:
        x: Random-key vector (length = number of customers)
        depot_index: Index of depot in coords (usually 0)
        coords: List of coordinates including depot
        demands: List of demands including depot (0 for depot)
        vehicle_capacity: Maximum vehicle capacity
    
    Returns:
        List of routes, each route is a list of node indices starting and ending with depot
    """
    n = len(coords) - 1  # exclude depot
    order = np.argsort(x)
    
    routes = []
    current_route = [depot_index]
    current_load = 0
    
    for idx in order:
        cust_idx = idx + 1  # customers start at index 1
        d = demands[cust_idx]
        
        if current_load + d <= vehicle_capacity:
            current_route.append(cust_idx)
            current_load += d
        else:
            current_route.append(depot_index)
            routes.append(current_route)
            current_route = [depot_index, cust_idx]
            current_load = d
    
    current_route.append(depot_index)
    routes.append(current_route)
    
    return routes


def fitness_from_routes(
    routes: List[List[int]],
    coords: List[Tuple[float, float]],
    demands: List[int],
    vehicle_capacity: int,
    penalty_coeff: float = 1000.0
) -> float:
    """
    Calculate fitness (total distance + penalties) for a set of routes.
    
    Args:
        routes: List of routes
        coords: List of coordinates
        demands: List of demands
        vehicle_capacity: Maximum vehicle capacity
        penalty_coeff: Penalty coefficient for capacity violations
    
    Returns:
        Fitness value (lower is better)
    """
    total_distance = 0.0
    penalty = 0.0
    
    for route in routes:
        load = 0
        for i in range(len(route) - 1):
            total_distance += euclidean(coords[route[i]], coords[route[i + 1]])
            if route[i] != 0:
                load += demands[route[i]]
        
        # Final load check
        load = sum(demands[c] for c in route if c != 0)
        if load > vehicle_capacity:
            penalty += penalty_coeff * (load - vehicle_capacity)
    
    return total_distance + penalty


def calculate_route_details(
    routes: List[List[int]],
    coords: List[Tuple[float, float]],
    demands: List[int]
) -> List[Dict[str, Any]]:
    """Calculate detailed information for each route."""
    details = []
    
    for route in routes:
        distance = 0.0
        for i in range(len(route) - 1):
            distance += euclidean(coords[route[i]], coords[route[i + 1]])
        
        load = sum(demands[c] for c in route if c != 0)
        
        details.append({
            "route": route,
            "distance": round(distance, 2),
            "load": load
        })
    
    return details


class VRPOptimizer:
    """High-level VRP optimizer using GWO."""
    
    def __init__(
        self,
        depot: Tuple[float, float],
        customers: List[Dict[str, Any]],
        vehicle_capacity: int,
        num_wolves: int = 30,
        num_iterations: int = 100,
        penalty_coefficient: float = 1000.0,
        seed: Optional[int] = None
    ):
        self.depot = depot
        self.customers = customers
        self.vehicle_capacity = vehicle_capacity
        self.num_wolves = num_wolves
        self.num_iterations = num_iterations
        self.penalty_coefficient = penalty_coefficient
        self.seed = seed
        
        # Build coords and demands arrays
        self.coords = [depot]
        self.demands = [0]  # depot has 0 demand
        
        for c in customers:
            self.coords.append((c["lat"], c["lng"]))
            self.demands.append(c["demand"])
        
        # Create customer ID mapping
        self.id_map = {0: 0}  # depot maps to itself
        for i, c in enumerate(customers, 1):
            self.id_map[i] = c["id"]
        
        self._gwo = None
        self._cancelled = False
    
    def _create_objective(self):
        """Create the objective function for GWO."""
        coords = self.coords
        demands = self.demands
        capacity = self.vehicle_capacity
        penalty = self.penalty_coefficient
        
        def objective(x):
            routes = decode_random_keys(x, 0, coords, demands, capacity)
            return fitness_from_routes(routes, coords, demands, capacity, penalty)
        
        return objective
    
    def optimize(
        self,
        progress_callback: Optional[Callable[[OptimizationProgress], None]] = None,
        progress_interval: int = 5
    ) -> OptimizationResult:
        """
        Run the VRP optimization.
        
        Args:
            progress_callback: Optional callback for progress updates.
            progress_interval: Interval between progress updates.
        
        Returns:
            OptimizationResult with routes and statistics.
        """
        start_time = time.time()
        
        dim = len(self.customers)  # one dimension per customer
        lb = [0.0] * dim
        ub = [1.0] * dim
        
        obj_func = self._create_objective()
        
        self._gwo = GreyWolfOptimizer(
            obj_func=obj_func,
            dim=dim,
            lb=lb,
            ub=ub,
            population=self.num_wolves,
            max_iter=self.num_iterations,
            seed=self.seed
        )
        
        best_solution, best_fitness, convergence = self._gwo.optimize(
            progress_callback=progress_callback,
            progress_interval=progress_interval
        )
        
        runtime = time.time() - start_time
        
        # Decode final routes
        internal_routes = decode_random_keys(
            best_solution, 0, self.coords, self.demands, self.vehicle_capacity
        )
        
        # Map internal indices back to customer IDs
        routes = []
        for route in internal_routes:
            mapped_route = [self.id_map.get(idx, idx) for idx in route]
            routes.append(mapped_route)
        
        # Calculate route details
        route_details = calculate_route_details(internal_routes, self.coords, self.demands)
        
        return OptimizationResult(
            routes=routes,
            best_fitness=float(best_fitness),
            convergence_history=convergence,
            runtime=round(runtime, 3),
            route_details=route_details
        )
    
    def cancel(self):
        """Cancel the optimization."""
        self._cancelled = True
        if self._gwo:
            self._gwo.cancel()
