from typing import Optional

from pydantic import BaseModel


class SatelliteGeocodeRequest(BaseModel):
    query: str


class SatelliteFacilitiesRequest(BaseModel):
    lat: float
    lon: float
    radius_km: Optional[float] = 5.0


class SatelliteSentinelSearchRequest(BaseModel):
    lat: float
    lon: float
    delta: Optional[float] = 0.05


class SatelliteImageRequest(BaseModel):
    lat: float
    lon: float
    delta: Optional[float] = 0.05
    image_type: Optional[str] = "true_colour"
    month: Optional[str] = None
    size: Optional[int] = 512


class SatelliteAnomalyRequest(BaseModel):
    lat: float
    lon: float
    delta: Optional[float] = 0.05


class SatelliteCompareRequest(BaseModel):
    lat: float
    lon: float
    delta: Optional[float] = 0.05
    image_type: Optional[str] = "true_colour"


class SatelliteLiveTrackerBBoxRequest(BaseModel):
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


class SatelliteLiveTrackerAircraftTrackRequest(BaseModel):
    icao24: str
    time_unix: Optional[int] = None


class SatelliteLiveTrackerAircraftIcaoRequest(BaseModel):
    icao24: str


class SatelliteLiveTrackerShipMmsiRequest(BaseModel):
    mmsi: str


class SatelliteLiveTrackerStatusRequest(BaseModel):
    pass
