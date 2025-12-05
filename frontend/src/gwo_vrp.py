"""
Core GWO adapted for Random-Keys encoding for VRP.
Provides:
 - GreyWolfOptimizer class
 - decode_random_keys function (to routes)
 - fitness function computing total distance + penalties
"""
import numpy as np
from math import hypot

class GreyWolfOptimizer:
    def __init__(self, obj_func, dim, lb, ub, population=30, max_iter=100, seed=None):
        self.obj_func = obj_func
        self.dim = dim
        self.lb = np.array(lb)
        self.ub = np.array(ub)
        self.pop = population
        self.max_iter = max_iter
        self.rng = np.random.default_rng(seed)

    def _init_population(self):
        return self.rng.uniform(self.lb, self.ub, size=(self.pop, self.dim))

    def optimize(self, verbose=False):
        X = self._init_population()
        fitness = np.apply_along_axis(self.obj_func, 1, X)
        idx = np.argsort(fitness)
        X = X[idx]
        fitness = fitness[idx]
        alpha, beta, delta = X[0].copy(), X[1].copy(), X[2].copy()
        alpha_fit, beta_fit, delta_fit = fitness[0], fitness[1], fitness[2]

        best_history = [alpha_fit]
        for t in range(1, self.max_iter+1):
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
                alpha = X[0].copy(); alpha_fit = fitness[0]
            beta = X[1].copy(); beta_fit = fitness[1]
            delta = X[2].copy(); delta_fit = fitness[2]

            best_history.append(alpha_fit)
            if verbose and t % max(1, self.max_iter//10) == 0:
                print(f"Iter {t}/{self.max_iter} best = {alpha_fit:.4f}")

        return alpha, alpha_fit, best_history

# --- VRP specific utilities ---

def euclidean(a, b):
    return hypot(a[0]-b[0], a[1]-b[1])


def decode_random_keys(x, depot_index, coords, demands, vehicle_capacity):
    """Decode a random-key vector x (length = number of customers) to a list of routes.
    depot_index: index of depot in coords/demands (usually 0)
    coords: list/array of coordinates indexed same as demands (including depot)
    demands: list/array of demands indexed same as coords
    """
    n = len(coords) - 1  # exclude depot
    # x should correspond to customers only (size n)
    order = np.argsort(x)
    routes = []
    current_route = [depot_index]
    current_load = 0
    for idx in order:
        cust_idx = idx + 1  # assume customers start at 1
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


def fitness_from_routes(routes, coords, demands, vehicle_capacity, penalty_coeff=1000.0):
    total_distance = 0.0
    penalty = 0.0
    for r in routes:
        load = 0
        for i in range(len(r)-1):
            total_distance += euclidean(coords[r[i]], coords[r[i+1]])
            if r[i] != 0:
                load += demands[r[i]]
        # last node before depot might be customer; also need to sum last if not depot
        # compute load properly
        load = sum(demands[c] for c in r if c != 0)
        if load > vehicle_capacity:
            penalty += penalty_coeff * (load - vehicle_capacity)
    return total_distance + penalty


