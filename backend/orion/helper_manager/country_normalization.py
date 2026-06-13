import re
import unicodedata
from collections.abc import Iterable

try:
    import pycountry
except ModuleNotFoundError:
    pycountry = None

_CONVENTIONAL_ALIASES = {
    "AE": ("UAE",),
    "BO": ("Bolivia",),
    "BN": ("Brunei",),
    "CV": ("Cape Verde",),
    "GB": ("UK", "Great Britain", "Britain"),
    "IR": ("Iran",),
    "LA": ("Laos",),
    "MD": ("Moldova",),
    "PS": ("Palestine",),
    "RU": ("Russia",),
    "SY": ("Syria",),
    "TL": ("East Timor",),
    "TW": ("Taiwan",),
    "US": ("U.S.", "U.S.A."),
    "VE": ("Venezuela",),
}


def _lookup_key(value: str) -> str:
    if not isinstance(value, str):
        return ""

    ascii_value = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(char for char in ascii_value if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "", ascii_value.casefold())


def _country_values(country) -> list[str]:
    return [
        value
        for value in (
            getattr(country, "alpha_2", None),
            getattr(country, "alpha_3", None),
            getattr(country, "numeric", None),
            getattr(country, "name", None),
            getattr(country, "official_name", None),
            getattr(country, "common_name", None),
        )
        if value
    ]


def _build_country_index() -> dict[str, str]:
    country_index = {}

    if pycountry:
        for country in pycountry.countries:
            for value in _country_values(country):
                country_index[_lookup_key(value)] = country.alpha_2

    for alpha_2, aliases in _CONVENTIONAL_ALIASES.items():
        for alias in aliases:
            country_index[_lookup_key(alias)] = alpha_2

    return country_index


_COUNTRY_INDEX = _build_country_index()


def resolve_country_alpha2(value: object) -> str:
    return _COUNTRY_INDEX.get(_lookup_key(value), "")


def expand_country_filter_values(values: Iterable[object]) -> list[str]:
    expanded_values = []
    seen = set()

    for value in values:
        if not isinstance(value, str):
            continue

        compact_value = " ".join(value.split())
        if not compact_value:
            continue

        alpha_2 = resolve_country_alpha2(compact_value)
        country = pycountry.countries.get(alpha_2=alpha_2) if pycountry and alpha_2 else None
        candidates = [compact_value]

        if country:
            candidates.extend(_country_values(country))
            candidates.extend(_CONVENTIONAL_ALIASES.get(alpha_2, ()))

        for candidate in candidates:
            candidate_key = candidate.casefold()
            if candidate_key not in seen:
                seen.add(candidate_key)
                expanded_values.append(candidate)

    return expanded_values
