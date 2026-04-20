from pydantic import BaseModel
from typing import Optional


class SatelliteGeocodeRequest(BaseModel):
    query: str


class SatelliteFacilitiesRequest(BaseModel):
    lat:       float
    lon:       float
    radius_km: Optional[float] = 5.0


class SatelliteSentinelSearchRequest(BaseModel):
    lat:   float
    lon:   float
    delta: Optional[float] = 0.05


class SatelliteImageRequest(BaseModel):
    lat:              float
    lon:              float
    delta:            Optional[float] = 0.05
    image_type:       Optional[str]   = "true_colour"
    month:            Optional[str]   = None
    size:             Optional[int]   = 512
    sh_client_id:     Optional[str]   = None
    sh_client_secret: Optional[str]   = None


class SatelliteAnomalyRequest(BaseModel):
    lat:              float
    lon:              float
    delta:            Optional[float] = 0.05
    sh_client_id:     Optional[str]   = None
    sh_client_secret: Optional[str]   = None


class SatelliteCompareRequest(BaseModel):
    lat:        float
    lon:        float
    delta:      Optional[float] = 0.05
    image_type: Optional[str]   = "true_colour"


class SatelliteLiveTrackerBBoxRequest(BaseModel):
    lat_min:               float
    lat_max:               float
    lon_min:               float
    lon_max:               float
    opensky_client_id:     Optional[str] = None
    opensky_client_secret: Optional[str] = None
    aisstream_api_key:     Optional[str] = None


class SatelliteLiveTrackerAircraftTrackRequest(BaseModel):
    icao24:                str
    time_unix:             Optional[int] = None
    opensky_client_id:     Optional[str] = None
    opensky_client_secret: Optional[str] = None


class SatelliteLiveTrackerAircraftIcaoRequest(BaseModel):
    icao24:                str
    opensky_client_id:     Optional[str] = None
    opensky_client_secret: Optional[str] = None


class SatelliteLiveTrackerShipMmsiRequest(BaseModel):
    mmsi:              str
    aisstream_api_key: Optional[str] = None


class SatelliteLiveTrackerStatusRequest(BaseModel):
    pass
