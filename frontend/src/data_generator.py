"""
Generate synthetic CVRP instances for demo and testing.
"""
import numpy as np
import pandas as pd

def generate_cvrp(n_customers=20, seed=42, area_size=100, demand_low=1, demand_high=10):
    rng = np.random.default_rng(seed)
    depot = (area_size/2, area_size/2)
    coords = [depot]
    demands = [0]
    for i in range(n_customers):
        x = rng.uniform(0, area_size)
        y = rng.uniform(0, area_size)
        coords.append((x, y))
        demands.append(int(rng.integers(demand_low, demand_high+1)))
    df = pd.DataFrame({
        'idx': list(range(len(coords))),
        'x': [c[0] for c in coords],
        'y': [c[1] for c in coords],
        'demand': demands
    })
    return df

if __name__ == '__main__':
    df = generate_cvrp(15, seed=1)
    print(df.head())
