"""
Bloom species assignment for matches.

Assigns a pixel-plant species to each match based on compatibility signals.
Inspired by Terraria's biome-specific flora system — each relationship type
grows a different plant.

Phase 1: 12 built-in species, deterministic assignment.
Phase 2: Custom species via Plant Conversion Engine (Claude Vision API).
"""

PLANT_SPECIES = [
    # Romantic flowers — high personality overlap
    "sakura",        # Cherry blossom — pink petals drift down
    "rose",          # Rose bush — deep red layered blooms
    "peony",         # Peony — wide layered bloom (China's flower)
    "wisteria",      # Wisteria — cascading purple flower chains
    "lotus",         # Lotus — rises from water, majestic

    # Warm nature — strong values alignment
    "oak",           # Oak tree — wide canopy, grounded
    "sunflower",     # Sunflower — tall, golden, tracks sun

    # Elegant contrast — complementary traits
    "lavender",      # Lavender field — multiple purple spikes
    "dandelion",     # Dandelion — seeds fly away at stage 4

    # Tropical — adventurous/creative
    "plumeria",      # Frangipani — tropical 5-petal blooms
    "bougainvillea", # Bougainvillea — explosive magenta

    # Whimsical — intellectual/curious
    "glow_mushroom", # Glowing mushroom — Terraria homage
]

# Buckets map compatibility signals to species pools
_SPECIES_POOLS = {
    "romantic":    ["sakura", "rose", "peony", "wisteria", "lotus"],
    "grounded":    ["oak", "sunflower"],
    "contrast":    ["lavender", "dandelion"],
    "adventurous": ["plumeria", "bougainvillea"],
    "curious":     ["glow_mushroom", "dandelion"],
}


def _hash_pair(a: str, b: str) -> int:
    """Deterministic hash for a pair of user IDs (order-independent)."""
    combined = "".join(sorted([a, b]))
    h = 0
    for ch in combined:
        h = ((h * 31) + ord(ch)) & 0xFFFFFFFF
    return h


def classify_compatibility(
    tags_a: list[str] | None,
    tags_b: list[str] | None,
    goals_a: str | None,
    goals_b: str | None,
) -> str:
    """Classify compatibility bucket from profile signals."""
    tags_a = tags_a or []
    tags_b = tags_b or []
    goals_a = goals_a or ""
    goals_b = goals_b or ""

    # Personality tag overlap
    overlap = set(tags_a) & set(tags_b)
    overlap_ratio = len(overlap) / max(len(set(tags_a) | set(tags_b)), 1)

    # Check for adventurous/creative tags
    adventurous_tags = {"热爱旅行", "创意思维", "爱好运动"}
    curious_tags = {"理性冷静", "独立自主"}

    both_adventurous = bool(adventurous_tags & set(tags_a)) and bool(adventurous_tags & set(tags_b))
    both_curious = bool(curious_tags & set(tags_a)) and bool(curious_tags & set(tags_b))

    if both_adventurous:
        return "adventurous"
    if both_curious:
        return "curious"
    if overlap_ratio >= 0.4:
        return "romantic"
    if goals_a and goals_b and len(goals_a) > 10 and len(goals_b) > 10:
        return "grounded"
    if overlap_ratio < 0.2 and len(tags_a) > 2 and len(tags_b) > 2:
        return "contrast"

    return "romantic"  # default


# Maps internal bucket names to spec-defined API values
_BUCKET_TO_API = {
    "romantic": "romantic",
    "grounded": "warm",
    "contrast": "elegant",
    "adventurous": "tropical",
    "curious": "whimsical",
}


def compatibility_bucket_for_api(internal_bucket: str) -> str:
    """Convert internal bucket name to API-facing value per UI spec."""
    return _BUCKET_TO_API.get(internal_bucket, "romantic")


def assign_bloom_type(
    user_a_id: str,
    user_b_id: str,
    tags_a: list[str] | None = None,
    tags_b: list[str] | None = None,
    goals_a: str | None = None,
    goals_b: str | None = None,
) -> str:
    """Assign a plant species to a match.

    Returns one of the 12 species IDs. Deterministic for the same
    pair of users + compatibility bucket.
    """
    bucket = classify_compatibility(tags_a, tags_b, goals_a, goals_b)
    pool = _SPECIES_POOLS.get(bucket, PLANT_SPECIES)
    h = _hash_pair(user_a_id, user_b_id)
    return pool[h % len(pool)]
