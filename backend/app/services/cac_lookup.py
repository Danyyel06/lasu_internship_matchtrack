import os
import hashlib
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

_cache: dict[str, dict] = {}

class CacLookupAdapter(ABC):
    @abstractmethod
    def lookup(self, number: str, number_type: str) -> dict:
        """Look up a CAC/BN number. Returns result dict. Never raises on failure."""
        pass

class StubCacLookup(CacLookupAdapter):
    """Dev stub. Returns mock 'registered' result for any non-empty number."""
    def lookup(self, number: str, number_type: str) -> dict:
        if not number or not number.strip():
            return {"status": "error", "error": "Empty number provided"}
        cache_key = hashlib.md5(f"{number_type}:{number}".encode()).hexdigest()
        if cache_key in _cache:
            return _cache[cache_key]
        result = {
            "status": "registered",
            "registered_name": "[Stub] Business Name Ltd",
            "registration_date": "2020-01-15",
            "number_type": number_type,
            "number": number,
            "source": "stub",
            "checked_at": datetime.utcnow().isoformat(),
        }
        _cache[cache_key] = result
        return result

def get_cac_lookup() -> CacLookupAdapter:
    if not os.getenv("CAC_API_KEY"):
        return StubCacLookup()
    # TODO: return RealCacLookup() when CAC_API_KEY is set
    return StubCacLookup()
