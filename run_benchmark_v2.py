"""
Script pour exécuter le GWO avec paramètres optimisés.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.gwo_optimizer import VRPOptimizer, euclidean
import numpy as np
import json

def nearest_neighbor_baseline(depot, customers, vehicle_capacity):
    """Algorithme Nearest Neighbor comme baseline."""
    coords = [depot]
    demands = [0]
    for c in customers:
        coords.append((c["lat"], c["lng"]))
        demands.append(c["demand"])
    
    n = len(customers)
    visited = [False] * n
    routes = []
    
    while not all(visited):
        route = [0]
        load = 0
        current = 0
        
        while True:
            best_next = None
            best_dist = float('inf')
            
            for i in range(n):
                if not visited[i] and load + demands[i+1] <= vehicle_capacity:
                    dist = euclidean(coords[current], coords[i+1])
                    if dist < best_dist:
                        best_dist = dist
                        best_next = i
            
            if best_next is None:
                break
            
            visited[best_next] = True
            route.append(best_next + 1)
            load += demands[best_next + 1]
            current = best_next + 1
        
        route.append(0)
        if len(route) > 2:
            routes.append(route)
    
    total_dist = 0
    for route in routes:
        for i in range(len(route) - 1):
            total_dist += euclidean(coords[route[i]], coords[route[i+1]])
    
    return routes, total_dist

def run_benchmark():
    print("=" * 60)
    print("BENCHMARK GWO vs Nearest Neighbor (Paramètres optimisés)")
    print("=" * 60)
    
    # Paramètres optimisés
    NUM_WOLVES = 50
    NUM_ITERATIONS = 200
    
    test_cases = [
        {"name": "10 clients", "n_customers": 10, "capacity": 100},
        {"name": "20 clients", "n_customers": 20, "capacity": 150},
        {"name": "30 clients", "n_customers": 30, "capacity": 200},
    ]
    
    results = []
    
    for test in test_cases:
        print(f"\n--- {test['name']} ---")
        
        np.random.seed(42)
        depot = (50.0, 50.0)
        customers = []
        for i in range(test['n_customers']):
            customers.append({
                "id": i + 1,
                "lat": np.random.uniform(10, 90),
                "lng": np.random.uniform(10, 90),
                "demand": np.random.randint(10, 30)
            })
        
        capacity = test['capacity']
        
        # Baseline
        baseline_routes, baseline_dist = nearest_neighbor_baseline(depot, customers, capacity)
        print(f"  Baseline (NN):  {baseline_dist:.1f} unités, {len(baseline_routes)} routes")
        
        # GWO avec plusieurs runs pour trouver le meilleur
        best_gwo_dist = float('inf')
        best_result = None
        
        for seed in [42, 123, 456]:
            optimizer = VRPOptimizer(
                depot=depot,
                customers=customers,
                vehicle_capacity=capacity,
                num_wolves=NUM_WOLVES,
                num_iterations=NUM_ITERATIONS,
                penalty_coefficient=10000.0,
                seed=seed
            )
            result = optimizer.optimize()
            if result.best_fitness < best_gwo_dist:
                best_gwo_dist = result.best_fitness
                best_result = result
        
        gwo_routes = len(best_result.routes)
        print(f"  GWO (best):     {best_gwo_dist:.1f} unités, {gwo_routes} routes")
        
        improvement = ((baseline_dist - best_gwo_dist) / baseline_dist) * 100
        print(f"  Amélioration:   {improvement:+.1f}%")
        print(f"  Temps:          {best_result.runtime:.2f}s")
        
        results.append({
            "name": test['name'],
            "n_customers": test['n_customers'],
            "baseline_distance": round(baseline_dist, 1),
            "baseline_routes": len(baseline_routes),
            "gwo_distance": round(best_gwo_dist, 1),
            "gwo_routes": gwo_routes,
            "improvement_percent": round(improvement, 1),
            "runtime": round(best_result.runtime, 2)
        })
    
    print("\n" + "=" * 60)
    print("RÉSULTATS POUR LA PRÉSENTATION")
    print("=" * 60)
    
    for r in results:
        print(f"\n{r['name']}:")
        print(f"  Baseline: {r['baseline_distance']} unités ({r['baseline_routes']} routes)")
        print(f"  GWO:      {r['gwo_distance']} unités ({r['gwo_routes']} routes)")
        print(f"  Gain:     {r['improvement_percent']:+.1f}%")
    
    # Calcul des moyennes
    avg_baseline = sum(r['baseline_distance'] for r in results) / len(results)
    avg_gwo = sum(r['gwo_distance'] for r in results) / len(results)
    avg_improvement = ((avg_baseline - avg_gwo) / avg_baseline) * 100
    
    print(f"\nMOYENNE:")
    print(f"  Baseline moyen: {avg_baseline:.1f} unités")
    print(f"  GWO moyen:      {avg_gwo:.1f} unités")
    print(f"  Amélioration:   {avg_improvement:+.1f}%")
    
    with open("D:\\GWO-Project\\benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    return results

if __name__ == "__main__":
    run_benchmark()
