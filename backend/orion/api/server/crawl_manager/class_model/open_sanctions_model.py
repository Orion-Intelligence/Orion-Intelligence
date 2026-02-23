from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class open_sanctions_data_model(BaseModel):
    id: str
    caption: Optional[str] = None
    schema_name: Optional[str] = Field(default=None, alias="schema")
    target: Optional[bool] = None
    datasets: List[str] = Field(default_factory=list)
    referents: List[str] = Field(default_factory=list)
    origin: List[str] = Field(default_factory=list)
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    last_change: Optional[datetime] = None

    country: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    program_id: Optional[str] = None
    authority: Optional[str] = None
    entity: Optional[str] = None
    program_url: Optional[str] = None
    program: Optional[str] = None
    authority_id: Optional[str] = None
    start_date: Optional[datetime] = None
    reason: Optional[str] = None
    provisions: Optional[str] = None
    name: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    listing_date: Optional[datetime] = None
    status: Optional[str] = None
    end_date: Optional[datetime] = None
    alias: List[str] = Field(default_factory=list)
    address: Optional[str] = None
    duration: Optional[str] = None
    birth_date: Optional[datetime] = None
    summary: Optional[str] = None
    modified_at: Optional[datetime] = None
    full: Optional[str] = None
    holder: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    citizenship: List[str] = Field(default_factory=list)
    type: Optional[str] = None
    number: Optional[str] = None
    address_entity: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    inn_code: Optional[str] = None
    birth_place: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None
    position: Optional[str] = None
    created_at: Optional[datetime] = None
    nationality: List[str] = Field(default_factory=list)
    role: Optional[str] = None
    jurisdiction: Optional[str] = None
    father_name: Optional[str] = None
    postal_code: Optional[str] = None
    gender: Optional[str] = None
    registration_number: Optional[str] = None
    mother_name: Optional[str] = None
    tax_number: Optional[str] = None
    record_id: Optional[str] = None
    ogrn_code: Optional[str] = None
    middle_name: Optional[str] = None
    unsc_id: Optional[str] = None
    asset: Optional[str] = None
    owner: Optional[str] = None
    passport_number: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None
    incorporation_date: Optional[datetime] = None
    weak_alias: List[str] = Field(default_factory=list)
    birth_country: Optional[str] = None
    issuer: Optional[str] = None
    isin: Optional[str] = None
    subject: Optional[str] = None
    object: Optional[str] = None
    website: Optional[str] = None
    lei_code: Optional[str] = None
    public_key: Optional[str] = None
    email: Optional[str] = None
    imo_number: Optional[str] = None
    flag: Optional[str] = None
    phone: Optional[str] = None
    legal_form: Optional[str] = None
    agent: Optional[str] = None
    client: Optional[str] = None
    currency: Optional[str] = None
    sector: Optional[str] = None
    title: Optional[str] = None
    build_date: Optional[datetime] = None
    managing_exchange: Optional[str] = None
    call_sign: Optional[str] = None
    region: Optional[str] = None
    mmsi: Optional[str] = None
    date: Optional[datetime] = None
    organization: Optional[str] = None
    publisher: Optional[str] = None
    previous_name: Optional[str] = None
    director: Optional[str] = None
    post_office_box: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    kpp_code: Optional[str] = None
    classification: Optional[str] = None
    swift_bic: Optional[str] = None
    tonnage: Optional[str] = None
    person: Optional[str] = None
    relative: Optional[str] = None
    relationship: Optional[str] = None
    gross_registered_tonnage: Optional[str] = None
    vat_code: Optional[str] = None
    past_flags: List[str] = Field(default_factory=list)
    okpo_code: Optional[str] = None
    abbreviation: Optional[str] = None
    remarks: Optional[str] = None
    ticker: Optional[str] = None
    wikidata_id: Optional[str] = None
    member: Optional[str] = None
    duns_code: Optional[str] = None
    death_date: Optional[datetime] = None
    bik_code: Optional[str] = None
    usc_code: Optional[str] = None
    gii_number: Optional[str] = None
    dissolution_date: Optional[datetime] = None
    political: Optional[bool] = None
    social_security_number: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
    }
