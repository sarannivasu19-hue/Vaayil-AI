import importlib
import inspect
from pathlib import Path
from typing import Dict, List, Optional
from app.sectors.base import SectorPackage

_REGISTRY: Dict[str, SectorPackage] = {}


def _discover_and_register_packages() -> None:
    """
    Dynamically scans the app/sectors package directory.
    Every Python file containing a 'PACKAGE' instance of SectorPackage
    is automatically discovered and registered.
    Adding a new sector requires creating only one package file.
    """
    sectors_dir = Path(__file__).parent
    for file_path in sectors_dir.glob("*.py"):
        module_name = file_path.stem
        if module_name in ("__init__", "base", "registry"):
            continue

        try:
            mod = importlib.import_module(f"app.sectors.{module_name}")
            package = getattr(mod, "PACKAGE", None)
            if isinstance(package, SectorPackage):
                _REGISTRY[package.id] = package
        except Exception as e:
            print(f"Error loading sector package {module_name}: {e}")


# Initialize discovery
_discover_and_register_packages()


def get_all_sector_packages() -> List[SectorPackage]:
    """Returns all dynamically discovered sector packages."""
    if not _REGISTRY:
        _discover_and_register_packages()
    return list(_REGISTRY.values())


def get_sector_package(sector_id: str) -> Optional[SectorPackage]:
    """Retrieves a sector package definition by its unique ID."""
    if not _REGISTRY:
        _discover_and_register_packages()
    return _REGISTRY.get(sector_id)


def register_package(package: SectorPackage) -> None:
    """Manually register or override a sector package."""
    _REGISTRY[package.id] = package

