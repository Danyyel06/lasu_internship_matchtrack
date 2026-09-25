from typing import Any

CAPABILITY_MATRIX = {
    "view_dashboard": [1, 2, 3, 4],
    "browse_students_anonymised": [1, 2, 3, 4],
    "post_internship": [2, 3, 4],
    "post_internship_max": {1: 0, 2: 2, 3: None, 4: None},  # None = unlimited
    "receive_equity_track_applications": [2, 3, 4],
    "receive_competitive_track_applications": [3, 4],
    "see_student_contact_details": [2, 3, 4],  # only after coordinator approval
    "register_supervisors": [2, 3, 4],
    "register_supervisors_max": {1: 0, 2: 1, 3: None, 4: None},
    "featured_placement": [4],
}

def get_capabilities(trust_tier: int, tier_statuses: dict[str, str | None]) -> dict[str, Any]:
    """Return a capabilities dict for a company at a given trust tier."""
    effective_tier = trust_tier if tier_statuses.get(f"tier_{trust_tier}_status") == "approved" else trust_tier
    
    caps: dict[str, Any] = {}
    for cap, allowed_tiers in CAPABILITY_MATRIX.items():
        if cap.endswith("_max"):
            caps[cap] = allowed_tiers.get(effective_tier, 0)
        elif isinstance(allowed_tiers, list):
            caps[cap] = effective_tier in allowed_tiers
    
    caps["trust_tier"] = trust_tier
    caps["tier_statuses"] = tier_statuses
    return caps

def can_do(trust_tier: int, capability: str) -> bool:
    """Quick boolean check for a single capability."""
    allowed = CAPABILITY_MATRIX.get(capability, [])
    if isinstance(allowed, list):
        return trust_tier in allowed
    return False
