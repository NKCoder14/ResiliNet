"""Seed data for the ResiliNet demo city.

All data is SIMULATED. No real-world infrastructure is represented.
Coordinates form a believable urban area layout.
"""

from app.models import AssetType, InfrastructureAsset, Edge

# ---------------------------------------------------------------------------
# Infrastructure Assets  (~18 nodes)
# Coordinates centred around a fictional city grid (lat ~28.61-28.66, lng ~77.20-77.26)
# ---------------------------------------------------------------------------

SEED_ASSETS: list[InfrastructureAsset] = [
    # --- Bridges (3) ---
    InfrastructureAsset(
        id="bridge_alpha",
        name="Bridge Alpha",
        type=AssetType.BRIDGE,
        latitude=28.6350,
        longitude=77.2250,
        criticality=0,  # computed at runtime
        capacity=200,
        population_served=15000,
        dependencies=[],
    ),
    InfrastructureAsset(
        id="bridge_beta",
        name="Bridge Beta",
        type=AssetType.BRIDGE,
        latitude=28.6180,
        longitude=77.2150,
        criticality=0,
        capacity=150,
        population_served=8000,
        dependencies=[],
    ),
    InfrastructureAsset(
        id="bridge_gamma",
        name="Bridge Gamma",
        type=AssetType.BRIDGE,
        latitude=28.6280,
        longitude=77.2050,
        criticality=0,
        capacity=120,
        population_served=5000,
        dependencies=[],
    ),

    # --- Roads (7) ---
    InfrastructureAsset(
        id="road_north",
        name="Road North",
        type=AssetType.ROAD,
        latitude=28.6450,
        longitude=77.2280,
        criticality=0,
        capacity=180,
        population_served=6000,
        dependencies=["bridge_alpha"],
    ),
    InfrastructureAsset(
        id="road_central",
        name="Road Central",
        type=AssetType.ROAD,
        latitude=28.6320,
        longitude=77.2300,
        criticality=0,
        capacity=160,
        population_served=10000,
        dependencies=["bridge_alpha"],
    ),
    InfrastructureAsset(
        id="road_east",
        name="Road East",
        type=AssetType.ROAD,
        latitude=28.6300,
        longitude=77.2450,
        criticality=0,
        capacity=140,
        population_served=7000,
        dependencies=["road_central"],
    ),
    InfrastructureAsset(
        id="road_south",
        name="Road South",
        type=AssetType.ROAD,
        latitude=28.6150,
        longitude=77.2250,
        criticality=0,
        capacity=150,
        population_served=5500,
        dependencies=["bridge_beta"],
    ),
    InfrastructureAsset(
        id="road_west",
        name="Road West",
        type=AssetType.ROAD,
        latitude=28.6280,
        longitude=77.2100,
        criticality=0,
        capacity=130,
        population_served=4000,
        dependencies=["bridge_gamma"],
    ),
    InfrastructureAsset(
        id="road_ring",
        name="Ring Road",
        type=AssetType.ROAD,
        latitude=28.6380,
        longitude=77.2120,
        criticality=0,
        capacity=200,
        population_served=3000,
        dependencies=["road_west"],
    ),
    InfrastructureAsset(
        id="road_industrial",
        name="Industrial Road",
        type=AssetType.ROAD,
        latitude=28.6200,
        longitude=77.2400,
        criticality=0,
        capacity=100,
        population_served=2000,
        dependencies=["road_east", "road_south"],
    ),

    # --- Hospitals (3) ---
    InfrastructureAsset(
        id="hospital_east",
        name="Hospital East",
        type=AssetType.HOSPITAL,
        latitude=28.6310,
        longitude=77.2520,
        criticality=0,
        capacity=300,
        population_served=25000,
        dependencies=["road_east"],
    ),
    InfrastructureAsset(
        id="hospital_west",
        name="Hospital West",
        type=AssetType.HOSPITAL,
        latitude=28.6200,
        longitude=77.2080,
        criticality=0,
        capacity=250,
        population_served=18000,
        dependencies=["road_south", "road_west"],
    ),
    InfrastructureAsset(
        id="hospital_central",
        name="Central Medical",
        type=AssetType.HOSPITAL,
        latitude=28.6420,
        longitude=77.2350,
        criticality=0,
        capacity=400,
        population_served=30000,
        dependencies=["road_north", "road_central"],
    ),

    # --- Utilities (2) ---
    InfrastructureAsset(
        id="power_station_1",
        name="Power Station North",
        type=AssetType.POWER,
        latitude=28.6500,
        longitude=77.2200,
        criticality=0,
        capacity=500,
        population_served=40000,
        dependencies=[],
    ),
    InfrastructureAsset(
        id="water_treatment",
        name="Water Treatment Plant",
        type=AssetType.WATER,
        latitude=28.6130,
        longitude=77.2350,
        criticality=0,
        capacity=400,
        population_served=35000,
        dependencies=[],
    ),

    # --- Emergency Facilities (2) ---
    InfrastructureAsset(
        id="fire_station",
        name="Fire Station Central",
        type=AssetType.EMERGENCY_FACILITY,
        latitude=28.6340,
        longitude=77.2180,
        criticality=0,
        capacity=50,
        population_served=20000,
        dependencies=["road_central", "road_west"],
    ),
    InfrastructureAsset(
        id="emergency_hq",
        name="Emergency HQ",
        type=AssetType.EMERGENCY_FACILITY,
        latitude=28.6400,
        longitude=77.2150,
        criticality=0,
        capacity=30,
        population_served=50000,
        dependencies=["road_north", "ring_road"],
    ),

    # --- School hub (1 – counts as road-type for connectivity) ---
    InfrastructureAsset(
        id="school_district",
        name="School District Hub",
        type=AssetType.ROAD,
        latitude=28.6250,
        longitude=77.2320,
        criticality=0,
        capacity=80,
        population_served=12000,
        dependencies=["road_south", "road_east"],
    ),
]


# ---------------------------------------------------------------------------
# Edges  (~25 directed edges)
# An edge (A → B) means B depends on A being functional.
# ---------------------------------------------------------------------------

SEED_EDGES: list[Edge] = [
    # Bridge Alpha feeds into major corridors
    Edge(source="bridge_alpha", target="road_central", weight=1.0, capacity=160, travel_time=3, edge_type="road_dependency"),
    Edge(source="bridge_alpha", target="road_north", weight=1.0, capacity=180, travel_time=4, edge_type="road_dependency"),

    # Road Central corridor
    Edge(source="road_central", target="road_east", weight=1.0, capacity=140, travel_time=5, edge_type="road_link"),
    Edge(source="road_central", target="fire_station", weight=0.8, capacity=50, travel_time=3, edge_type="access"),

    # Road East connections
    Edge(source="road_east", target="hospital_east", weight=1.0, capacity=300, travel_time=4, edge_type="access"),
    Edge(source="road_east", target="road_industrial", weight=0.7, capacity=100, travel_time=6, edge_type="road_link"),
    Edge(source="road_east", target="school_district", weight=0.6, capacity=80, travel_time=5, edge_type="access"),

    # Road North connections
    Edge(source="road_north", target="hospital_central", weight=1.0, capacity=400, travel_time=5, edge_type="access"),
    Edge(source="road_north", target="emergency_hq", weight=0.9, capacity=30, travel_time=3, edge_type="access"),

    # Bridge Beta corridor
    Edge(source="bridge_beta", target="road_south", weight=1.0, capacity=150, travel_time=4, edge_type="road_dependency"),

    # Road South connections
    Edge(source="road_south", target="hospital_west", weight=1.0, capacity=250, travel_time=5, edge_type="access"),
    Edge(source="road_south", target="road_industrial", weight=0.6, capacity=100, travel_time=7, edge_type="road_link"),
    Edge(source="road_south", target="school_district", weight=0.5, capacity=80, travel_time=6, edge_type="access"),

    # Bridge Gamma corridor
    Edge(source="bridge_gamma", target="road_west", weight=1.0, capacity=130, travel_time=3, edge_type="road_dependency"),

    # Road West connections
    Edge(source="road_west", target="road_ring", weight=1.0, capacity=200, travel_time=4, edge_type="road_link"),
    Edge(source="road_west", target="hospital_west", weight=0.8, capacity=250, travel_time=6, edge_type="access"),
    Edge(source="road_west", target="fire_station", weight=0.7, capacity=50, travel_time=4, edge_type="access"),

    # Ring Road bypass connections (alternate routes)
    Edge(source="road_ring", target="road_north", weight=0.5, capacity=100, travel_time=8, edge_type="bypass"),
    Edge(source="road_ring", target="emergency_hq", weight=0.6, capacity=30, travel_time=6, edge_type="access"),

    # Utility connections (power + water to critical facilities)
    Edge(source="power_station_1", target="hospital_east", weight=0.9, capacity=300, travel_time=0, edge_type="power_supply"),
    Edge(source="power_station_1", target="hospital_central", weight=0.9, capacity=400, travel_time=0, edge_type="power_supply"),
    Edge(source="power_station_1", target="emergency_hq", weight=0.8, capacity=30, travel_time=0, edge_type="power_supply"),

    Edge(source="water_treatment", target="hospital_west", weight=0.8, capacity=250, travel_time=0, edge_type="water_supply"),
    Edge(source="water_treatment", target="hospital_central", weight=0.8, capacity=400, travel_time=0, edge_type="water_supply"),
    Edge(source="water_treatment", target="school_district", weight=0.5, capacity=80, travel_time=0, edge_type="water_supply"),

    # Cross-connections for realism
    Edge(source="road_central", target="hospital_central", weight=0.6, capacity=200, travel_time=7, edge_type="alternate_access"),
]


def get_assets_dict() -> dict[str, InfrastructureAsset]:
    """Return assets indexed by id."""
    return {a.id: a for a in SEED_ASSETS}


def get_edges() -> list[Edge]:
    """Return the full edge list."""
    return SEED_EDGES
