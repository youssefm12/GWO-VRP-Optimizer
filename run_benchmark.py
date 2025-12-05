"""
Script pour exécuter le GWO et obtenir les vrais résultats pour la présentation.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.gwo_optimizer import VRPOptimizer, decode_random_keys, fitness_from_routes, euclidean
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
        route = [0]  # Start at depot
        load = 0
        current = 0  # depot
        
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
        
        route.append(0)  # Return to depot
        if len(route) > 2:
            routes.append(route)
    
    # Calculate total distance
    total_dist = 0
    for route in routes:
        for i in range(len(route) - 1):
            total_dist += euclidean(coords[route[i]], coords[route[i+1]])
    
    return routes, total_dist

def run_benchmark():
    print("=" * 60)
    print("BENCHMARK GWO vs Nearest Neighbor")
    print("=" * 60)
    
    # Test avec différentes tailles
    test_cases = [
        {"name": "Petit (10 clients)", "n_customers": 10, "capacity": 50},
        {"name": "Moyen (20 clients)", "n_customers": 20, "capacity": 100},
        {"name": "Grand (30 clients)", "n_customers": 30, "capacity": 100},
    ]
    
    results = []
    
    for test in test_cases:
        print(f"\n--- {test['name']} ---")
        
        # Générer des données aléatoires
        np.random.seed(42)
        depot = (50.0, 50.0)
        customers = []
        for i in range(test['n_customers']):
            customers.append({
                "id": i + 1,
                "lat": np.random.uniform(0, 100),
                "lng": np.random.uniform(0, 100),
                "demand": np.random.randint(5, 25)
            })
        
        capacity = test['capacity']
        
        # Baseline: Nearest Neighbor
        baseline_routes, baseline_dist = nearest_neighbor_baseline(depot, customers, capacity)
        print(f"  Baseline (NN): {baseline_dist:.2f} km, {len(baseline_routes)} routes")
        
        # GWO Optimization
        optimizer = VRPOptimizer(
            depot=depot,
            customers=customers,
            vehicle_capacity=capacity,
            num_wolves=30,
            num_iterations=100,
            penalty_coefficient=1000.0,
            seed=42
        )
        
        result = optimizer.optimize()
        gwo_dist = result.best_fitness
        gwo_routes = len(result.routes)
        
        print(f"  GWO:           {gwo_dist:.2f} km, {gwo_routes} routes")
        
        improvement = ((baseline_dist - gwo_dist) / baseline_dist) * 100
        print(f"  Amélioration:  {improvement:.1f}%")
        print(f"  Temps:         {result.runtime:.3f}s")
        
        results.append({
            "name": test['name'],
            "n_customers": test['n_customers'],
            "baseline_distance": round(baseline_dist, 2),
            "baseline_routes": len(baseline_routes),
            "gwo_distance": round(gwo_dist, 2),
            "gwo_routes": gwo_routes,
            "improvement_percent": round(improvement, 1),
            "runtime": result.runtime,
            "convergence": result.convergence_history
        })
    
    # Résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ POUR LA PRÉSENTATION")
    print("=" * 60)
    
    avg_improvement = sum(r['improvement_percent'] for r in results) / len(results)
    best_result = results[-1]  # 30 clients
    
    print(f"""
Métriques clés (instance 30 clients):
- Distance GWO:        {best_result['gwo_distance']:.0f} unités
- Distance Baseline:   {best_result['baseline_distance']:.0f} unités
- Amélioration:        {best_result['improvement_percent']:.1f}%
- Nombre de routes:    {best_result['gwo_routes']} véhicules
- Temps de calcul:     {best_result['runtime']:.2f}s

Amélioration moyenne:  {avg_improvement:.1f}%
""")
    
    # Sauvegarder les résultats
    with open("D:\\GWO-Project\\benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("Résultats sauvegardés dans benchmark_results.json")
    
    return results

if __name__ == "__main__":
    run_benchmark()
