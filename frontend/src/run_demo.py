"""
Quick demo: generate instance, run GWO on random-keys, save convergence plot and folium map html.
"""
import numpy as np
import matplotlib.pyplot as plt
import folium
from folium import plugins
import json
from src.gwo_vrp import GreyWolfOptimizer, decode_random_keys, fitness_from_routes, euclidean
from src.data_generator import generate_cvrp

def build_coords_and_demands(df):
    coords = [(row.x, row.y) for row in df.itertuples()]
    demands = [int(row.demand) for row in df.itertuples()]
    return coords, demands

def vector_obj_factory(coords, demands, vehicle_capacity):
    depot_index = 0
    n_customers = len(coords)-1
    def obj(x_full):
        # x_full is length == n_customers
        routes = decode_random_keys(x_full, depot_index, coords, demands, vehicle_capacity)
        return fitness_from_routes(routes, coords, demands, vehicle_capacity)
    return obj


def plot_convergence(history, out='results/convergence.png'):
    plt.figure(figsize=(6,4))
    plt.plot(history)
    plt.yscale('log')
    plt.xlabel('Iteration')
    plt.ylabel('Best fitness (log)')
    plt.title('GWO convergence')
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(out)
    plt.close()


def save_routes_map(routes, coords, out_html='results/routes_map.html'):
    # create folium map centered on depot
    depot = coords[0]
    m = folium.Map(location=depot, zoom_start=12)
    colors = ['red','blue','green','purple','orange','darkred','lightred','beige','darkblue','darkgreen']
    # plot customers
    for i,c in enumerate(coords):
        folium.CircleMarker(location=c, radius=4, color='black' if i==0 else 'gray', fill=True).add_to(m)
        folium.Popup(f"Idx: {i}").add_to(m)
    for i,route in enumerate(routes):
        coords_route = [coords[idx] for idx in route]
        folium.PolyLine(coords_route, color=colors[i%len(colors)], weight=3, opacity=0.8).add_to(m)
    m.save(out_html)
    print('Saved map to', out_html)

if __name__ == '__main__':
    import os
    os.makedirs('results', exist_ok=True)
    df = generate_cvrp(15, seed=2)
    coords, demands = build_coords_and_demands(df)
    vehicle_capacity = max(5, int(sum(demands)/4))
    obj = vector_obj_factory(coords, demands, vehicle_capacity)

    # Note: GWO expects vector size == number of customers
    dim = len(coords)-1
    lb = [0.0]*dim
    ub = [1.0]*dim
    gwo = GreyWolfOptimizer(obj, dim, lb, ub, population=20, max_iter=80, seed=1)
    best_vec, best_val, history = gwo.optimize(verbose=True)
    print('Best fitness:', best_val)

    # decode routes
    routes = decode_random_keys(best_vec, 0, coords, demands, vehicle_capacity)
    print('Routes:', routes)
    plot_convergence(history, out='results/convergence.png')
    save_routes_map(routes, coords, out_html='results/routes_map.html')

