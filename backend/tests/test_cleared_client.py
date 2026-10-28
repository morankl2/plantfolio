"""Tests for the cleared-plant-data source.

They run against a tiny database built here with the same tables and
`plant_traits` view as the data repo's build/poc/plants_poc.sqlite, so CI does
not need that repo. If the data repo changes the shape these tests rely on, its
build/poc/CHANGELOG.md bumps the schema version and this reader must follow.
"""

import sqlite3

import pytest

from app import cleared_client
from app.cleared_client import ClearedDataError, PlantNotFoundError

# Copied from the data repo's build (build/poc/plants_poc.sqlite, schema 1.0.x).
SCHEMA = """
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE plants (plant_id TEXT PRIMARY KEY, scientific_name TEXT, common_name TEXT);
CREATE TABLE traits (plant_id TEXT, trait TEXT, value TEXT, value_num REAL, basis TEXT, confidence TEXT);
CREATE TABLE names (plant_id TEXT NOT NULL, name TEXT NOT NULL, name_normalized TEXT NOT NULL, kind TEXT NOT NULL, source_id TEXT, source_key TEXT);
CREATE TABLE plant_regions (plant_id TEXT NOT NULL, region TEXT NOT NULL, nativity TEXT NOT NULL, confidence TEXT, basis TEXT, basis_text TEXT, PRIMARY KEY (plant_id, region));
CREATE TABLE zip_regions (zip TEXT PRIMARY KEY, region TEXT, county_fips TEXT, county TEXT, spans_counties INTEGER, spans_states INTEGER);
CREATE TABLE photos (plant_id TEXT NOT NULL, position INTEGER NOT NULL, source_id TEXT, photo_id TEXT,
  url_medium TEXT, url_large TEXT, page_url TEXT, license_name TEXT, license_url TEXT, attribution TEXT,
  PRIMARY KEY (plant_id, position));
CREATE VIEW plant_traits AS
SELECT p.plant_id, p.scientific_name, p.common_name,
  (SELECT group_concat(value, ', ') FROM traits WHERE plant_id = p.plant_id AND trait = 'sunlight_fws') AS sunlight_fws,
  (SELECT value FROM traits WHERE plant_id = p.plant_id AND trait = 'shade_tolerance_usda') AS shade_tolerance_usda,
  (SELECT group_concat(value, ', ') FROM traits WHERE plant_id = p.plant_id AND trait = 'sunlight_inferred') AS sunlight_inferred,
  (SELECT basis FROM traits WHERE plant_id = p.plant_id AND trait = 'sunlight_inferred' LIMIT 1) AS sunlight_inferred_basis,
  (SELECT confidence FROM traits WHERE plant_id = p.plant_id AND trait = 'sunlight_inferred' LIMIT 1) AS sunlight_inferred_confidence,
  (SELECT value FROM traits WHERE plant_id = p.plant_id AND trait = 'flowering' LIMIT 1) AS flowering,
  (SELECT value FROM traits WHERE plant_id = p.plant_id AND trait = 'edible' LIMIT 1) AS edible,
  (SELECT value_num FROM traits WHERE plant_id = p.plant_id AND trait = 'height_min_ft' LIMIT 1) AS height_min_ft,
  (SELECT value_num FROM traits WHERE plant_id = p.plant_id AND trait = 'height_max_ft' LIMIT 1) AS height_max_ft,
  (SELECT value_num FROM traits WHERE plant_id = p.plant_id AND trait = 'height_mature_ft_usda' LIMIT 1) AS height_mature_ft_usda,
  (SELECT value_num FROM traits WHERE plant_id = p.plant_id AND trait = 'spread_min_ft' LIMIT 1) AS spread_min_ft,
  (SELECT value_num FROM traits WHERE plant_id = p.plant_id AND trait = 'spread_max_ft' LIMIT 1) AS spread_max_ft,
  (SELECT value FROM traits WHERE plant_id = p.plant_id AND trait = 'bloom_period' LIMIT 1) AS bloom_period,
  (SELECT group_concat(value, ', ') FROM traits WHERE plant_id = p.plant_id AND trait IN ('flower_color_fws','flower_color_usda')) AS flower_color,
  (SELECT group_concat(value, ', ') FROM traits WHERE plant_id = p.plant_id AND trait = 'moisture_fws') AS moisture,
  (SELECT group_concat(value, ', ') FROM traits WHERE plant_id = p.plant_id AND trait = 'duration') AS duration,
  (SELECT group_concat(value, ', ') FROM traits WHERE plant_id = p.plant_id AND trait = 'growth_habit') AS growth_habit,
  (SELECT nativity FROM plant_regions WHERE plant_id = p.plant_id AND region = 'US-MD') AS nativity_us_md,
  (SELECT url_medium FROM photos WHERE plant_id = p.plant_id AND position = 1) AS primary_photo_url
FROM plants p;
"""

SUNNY, SHADY, TOMATO, BARE = "id-sunny", "id-shady", "id-tomato", "id-bare"


def build_db(path, schema_version="1.0.1"):
    conn = sqlite3.connect(path)
    conn.executescript(SCHEMA)
    if schema_version is not None:
        conn.execute("INSERT INTO meta VALUES ('schema_version', ?)", (schema_version,))
    conn.execute("INSERT INTO meta VALUES ('regions_with_plant_data', 'US-MD')")
    conn.executemany(
        "INSERT INTO zip_regions VALUES (?, ?, '00000', ?, ?, 0)",
        [
            ("20850", "US-MD", "Montgomery County", 0),
            ("21204", "US-MD", "Baltimore County", 1),
            ("07030", "US-NJ", "Hudson County", 0),
        ],
    )
    conn.executemany(
        "INSERT INTO plants VALUES (?, ?, ?)",
        [
            (SUNNY, "Echinacea fakeii", "Sunny coneflower"),
            (SHADY, "Polystichum fakeii", "Shady fern"),
            (TOMATO, "Solanum fakeii", "Tomato crop"),
            (BARE, "Nodata fakeii", None),  # no common name, no traits, no photo
        ],
    )

    def trait(plant, name, value=None, num=None):
        conn.execute("INSERT INTO traits VALUES (?, ?, ?, ?, NULL, NULL)", (plant, name, value, num))

    for tag in ("full sun", "partial shade"):
        trait(SUNNY, "sunlight_inferred", tag)
    trait(SUNNY, "flowering", "yes")
    trait(SUNNY, "height_min_ft", num=2.0)
    trait(SUNNY, "height_max_ft", num=4.0)
    trait(SUNNY, "spread_min_ft", num=1.5)
    trait(SUNNY, "spread_max_ft", num=1.5)
    trait(SUNNY, "bloom_period", "Jul-Sep")
    trait(SUNNY, "moisture_fws", "dry")
    trait(SUNNY, "moisture_fws", "moist")
    trait(SUNNY, "duration", "Perennial")

    trait(SHADY, "sunlight_inferred", "shade")
    trait(SHADY, "height_mature_ft_usda", num=3.0)
    trait(SHADY, "moisture_fws", "moist")

    trait(TOMATO, "edible", "yes")
    trait(TOMATO, "duration", "Annual")
    trait(TOMATO, "duration", "Perennial")

    # name_normalized as the data repo builds it: lower case, hyphens -> spaces, apostrophes removed.
    conn.executemany(
        "INSERT INTO names (plant_id, name, name_normalized, kind) VALUES (?, ?, ?, ?)",
        [
            (SUNNY, "Sunny coneflower", "sunny coneflower", "common"),
            (SUNNY, "Sun-lover's daisy", "sun lovers daisy", "common"),
            (SUNNY, "Echinacea fakeii L.", "echinacea fakeii", "scientific"),
            (SUNNY, "Rudbeckia oldname", "rudbeckia oldname", "synonym"),
            (SHADY, "Shady fern", "shady fern", "common"),
            (SHADY, "Polystichum fakeii", "polystichum fakeii", "scientific"),
            (TOMATO, "Tomato crop", "tomato crop", "common"),
            (TOMATO, "Solanum fakeii", "solanum fakeii", "scientific"),
            (BARE, "Nodata fakeii", "nodata fakeii", "scientific"),
        ],
    )
    conn.executemany(
        "INSERT INTO plant_regions VALUES (?, 'US-MD', ?, 'high', 'basis', ?)",
        [
            (SUNNY, "native", "Native in Maryland because of a test."),
            (SHADY, "unknown", "Mixed status."),
            (TOMATO, "cultivated", "Garden plant here."),
        ],
    )
    # A second region the data has a row for, though it is not in regions_with_plant_data.
    conn.execute("INSERT INTO plant_regions VALUES (?, 'US-VA', 'introduced', 'low', 'basis', 'Elsewhere.')", (SUNNY,))
    for plant in (SUNNY, SHADY, TOMATO):
        conn.execute(
            "INSERT INTO photos VALUES (?, 1, 'inat', '1', ?, ?, 'https://example.org/obs', 'CC BY', "
            "'https://creativecommons.org/licenses/by/4.0/', '(c) Someone, some rights reserved (CC BY)')",
            (plant, f"https://img.example/{plant}/medium.jpg", f"https://img.example/{plant}/large.jpg"),
        )
    conn.commit()
    conn.close()


@pytest.fixture
def cleared_db(tmp_path):
    path = tmp_path / "plants_test.sqlite"
    build_db(path)
    return path


@pytest.fixture
def cleared_app(app, cleared_db):
    app.config["CLEARED_DB_PATH"] = str(cleared_db)
    return app


@pytest.fixture
def cleared_client_ctx(cleared_app):
    with cleared_app.app_context():
        yield


def names(plants):
    return [p["commonName"] for p in plants]


# --- search -----------------------------------------------------------------


def test_search_returns_all_plants_sorted_by_common_name(cleared_client_ctx):
    assert names(cleared_client.search_plants()) == ["Nodata fakeii", "Shady fern", "Sunny coneflower", "Tomato crop"]


def test_sunlight_filter_matches_the_tag(cleared_client_ctx):
    assert names(cleared_client.search_plants(sunlight=["Shade"])) == ["Shady fern"]
    assert names(cleared_client.search_plants(sunlight=["Full Sun"])) == ["Sunny coneflower"]
    assert names(cleared_client.search_plants(sunlight=["Partial"])) == ["Sunny coneflower"]


def test_several_sunlight_choices_match_any_of_them(cleared_client_ctx):
    found = cleared_client.search_plants(sunlight=["Full Sun", "Shade"])
    assert names(found) == ["Shady fern", "Sunny coneflower"]


def test_unknown_sunlight_label_is_ignored(cleared_client_ctx):
    assert len(cleared_client.search_plants(sunlight=["Moonlight"])) == 4


def test_edible_filter(cleared_client_ctx):
    assert names(cleared_client.search_plants(edible=True)) == ["Tomato crop"]


def test_filters_combine_with_and(cleared_client_ctx):
    assert cleared_client.search_plants(sunlight=["Shade"], edible=True) == []


def test_zone_is_ignored_because_the_data_has_no_zones(cleared_client_ctx):
    assert len(cleared_client.search_plants(zone="7")) == 4


# --- name search ------------------------------------------------------------


def test_name_search_finds_a_common_name(cleared_client_ctx):
    assert names(cleared_client.search_plants(query="sunny")) == ["Sunny coneflower"]


def test_name_search_ignores_case_and_extra_spaces(cleared_client_ctx):
    assert names(cleared_client.search_plants(query="  SUNNY   Coneflower ")) == ["Sunny coneflower"]


def test_name_search_treats_hyphens_and_apostrophes_like_the_data_does(cleared_client_ctx):
    # The data stores "Sun-lover's daisy" as "sun lovers daisy".
    assert names(cleared_client.search_plants(query="sun-lover's daisy")) == ["Sunny coneflower"]
    assert names(cleared_client.search_plants(query="sun lovers")) == ["Sunny coneflower"]


def test_name_search_finds_latin_names_and_old_names(cleared_client_ctx):
    assert names(cleared_client.search_plants(query="Polystichum fakeii")) == ["Shady fern"]
    assert names(cleared_client.search_plants(query="rudbeckia oldname")) == ["Sunny coneflower"]


def test_name_search_matches_the_middle_of_a_name(cleared_client_ctx):
    assert names(cleared_client.search_plants(query="coneflow")) == ["Sunny coneflower"]


def test_name_search_with_no_match_is_empty(cleared_client_ctx):
    assert cleared_client.search_plants(query="zzzz") == []


def test_blank_name_search_returns_everything(cleared_client_ctx):
    assert len(cleared_client.search_plants(query="   ")) == 4


def test_name_search_wildcards_are_taken_literally(cleared_client_ctx):
    assert cleared_client.search_plants(query="%") == []
    assert cleared_client.search_plants(query="s_nny") == []


def test_name_search_combines_with_filters(cleared_client_ctx):
    assert len(cleared_client.search_plants(query="fakeii")) == 4
    assert names(cleared_client.search_plants(query="fakeii", sunlight=["Shade"])) == ["Shady fern"]
    assert cleared_client.search_plants(query="sunny", sunlight=["Shade"]) == []


def test_ids_limit_the_result_to_those_plants(cleared_client_ctx):
    assert names(cleared_client.search_plants(ids=[SHADY, SUNNY])) == ["Shady fern", "Sunny coneflower"]
    assert names(cleared_client.search_plants(ids=[TOMATO, "no-such-id"])) == ["Tomato crop"]


def test_an_empty_list_of_ids_means_no_plants_not_all_plants(cleared_client_ctx):
    assert cleared_client.search_plants(ids=[]) == []


def test_ids_combine_with_filters(cleared_client_ctx):
    assert names(cleared_client.search_plants(ids=[SHADY, SUNNY], sunlight=["Shade"])) == ["Shady fern"]


def test_normalize_query():
    assert cleared_client.normalize_query("Black-eyed  Susan") == "black eyed susan"
    assert cleared_client.normalize_query("Aaron\u2019s rod") == "aarons rod"
    assert cleared_client.normalize_query("Mentha \u00d7 piperita") == "mentha piperita"
    assert cleared_client.normalize_query(None) == ""


# --- what a plant looks like ------------------------------------------------


def test_normalized_plant_with_data(cleared_client_ctx):
    plant = next(p for p in cleared_client.search_plants() if p["id"] == SUNNY)

    assert plant["commonName"] == "Sunny coneflower"
    assert plant["latinName"] == "Echinacea fakeii"
    assert plant["sunlightTags"] == ["Full Sun", "Partial"]
    assert plant["sunlight"] == "Full Sun"
    assert plant["flowering"] is True
    assert plant["edible"] is None
    assert plant["native"] is True
    assert plant["nativity"] == "native"
    assert plant["nativityRegion"] == "US-MD"
    assert plant["nativityRegionName"] == "Maryland"
    assert plant["matureSize"] == "Height: 2–4 feet, Width: 1.5 feet"
    assert plant["bloomSeason"] == "Jul-Sep"
    assert plant["water"] == "Dry, Moist"
    assert plant["tags"] == ["Perennial"]
    assert plant["imageUrl"] == f"https://img.example/{SUNNY}/medium.jpg"
    assert plant["imageCredit"] == "(c) Someone, some rights reserved (CC BY)"
    assert plant["imageLicense"] == "CC BY"
    assert plant["imagePageUrl"] == "https://example.org/obs"


def test_height_falls_back_to_the_usda_mature_height(cleared_client_ctx):
    plant = next(p for p in cleared_client.search_plants() if p["id"] == SHADY)
    assert plant["matureSize"] == "Height: 3 feet"


def test_several_types_become_several_tags(cleared_client_ctx):
    plant = next(p for p in cleared_client.search_plants() if p["id"] == TOMATO)
    assert plant["tags"] == ["Annual", "Perennial"]


def test_missing_values_stay_empty_and_are_never_invented(cleared_client_ctx):
    plant = next(p for p in cleared_client.search_plants() if p["id"] == BARE)

    assert plant["commonName"] == "Nodata fakeii"  # falls back to the Latin name
    assert plant["sunlight"] is None
    assert plant["sunlightTags"] == []
    assert plant["zones"] == ""
    assert plant["water"] == ""
    assert plant["matureSize"] == ""
    assert plant["bloomSeason"] == ""
    assert plant["description"] == ""
    assert plant["tags"] == []
    assert plant["imageUrl"] == ""
    assert plant["imageCredit"] == ""
    assert plant["imagePageUrl"] == ""
    # "no data" must not turn into "no": these are None, never False.
    assert plant["flowering"] is None
    assert plant["edible"] is None
    assert plant["native"] is None
    assert plant["nativity"] is None


def test_detail_uses_the_large_photo(cleared_client_ctx):
    plant = cleared_client.get_plant_details(SUNNY)
    assert plant["imageUrl"] == f"https://img.example/{SUNNY}/large.jpg"
    assert plant["id"] == SUNNY


def test_unknown_plant_id_raises_not_found(cleared_client_ctx):
    with pytest.raises(PlantNotFoundError):
        cleared_client.get_plant_details("no-such-id")


# --- nativity, the Native filter and ZIP codes ------------------------------


def test_nativity_defaults_to_the_region_the_data_covers(cleared_client_ctx):
    by_id = {p["id"]: p for p in cleared_client.search_plants()}
    assert by_id[SUNNY]["nativity"] == "native"
    assert by_id[SHADY]["nativity"] == "unknown"
    assert by_id[TOMATO]["nativity"] == "cultivated"
    assert by_id[BARE]["nativity"] is None
    assert all(p["nativityRegion"] == "US-MD" for p in by_id.values())


def test_native_filter_keeps_only_native_plants(cleared_client_ctx):
    assert names(cleared_client.search_plants(native=True)) == ["Sunny coneflower"]


def test_native_filter_combines_with_other_filters(cleared_client_ctx):
    assert cleared_client.search_plants(native=True, sunlight=["Shade"]) == []
    assert names(cleared_client.search_plants(native=True, sunlight=["Full Sun"])) == ["Sunny coneflower"]


def test_nativity_is_for_the_region_asked_about(cleared_client_ctx):
    plant = next(p for p in cleared_client.search_plants(region="US-VA") if p["id"] == SUNNY)
    assert plant["nativity"] == "introduced"
    assert plant["nativityRegionName"] == "Virginia"
    assert plant["native"] is None
    assert cleared_client.search_plants(native=True, region="US-VA") == []


def test_a_region_with_no_plant_data_has_no_nativity(cleared_client_ctx):
    plants = cleared_client.search_plants(region="US-NJ")
    assert len(plants) == 4  # the plants themselves are not region-specific
    assert all(p["nativity"] is None for p in plants)
    assert cleared_client.search_plants(native=True, region="US-NJ") == []


def test_detail_has_the_reason_for_the_nativity(cleared_client_ctx):
    plant = cleared_client.get_plant_details(SUNNY)
    assert plant["nativityBasis"] == "Native in Maryland because of a test."
    assert plant["nativityConfidence"] == "high"
    assert cleared_client.get_plant_details(SUNNY, region="US-VA")["nativity"] == "introduced"


def test_zip_lookup(cleared_client_ctx):
    found = cleared_client.lookup_zip("20850")
    assert found == {
        "zip": "20850",
        "region": "US-MD",
        "regionName": "Maryland",
        "state": "MD",
        "county": "Montgomery County",
        "approximate": False,
        "hasPlantData": True,
    }


def test_zip_in_a_region_without_plant_data(cleared_client_ctx):
    found = cleared_client.lookup_zip("07030")
    assert found["regionName"] == "New Jersey"
    assert found["hasPlantData"] is False


def test_zip_spanning_counties_is_marked_approximate(cleared_client_ctx):
    assert cleared_client.lookup_zip("21204")["approximate"] is True


def test_unknown_zip_is_none_and_a_bad_zip_is_an_error(cleared_client_ctx):
    assert cleared_client.lookup_zip("99999") is None
    for bad in ("2085", "abcde", "208500", ""):
        with pytest.raises(ValueError):
            cleared_client.lookup_zip(bad)


def test_region_names():
    assert cleared_client.region_name("US-MD") == "Maryland"
    assert cleared_client.region_name("US-DC") == "District of Columbia"
    assert cleared_client.region_name("XX-ZZ") == "XX-ZZ"
    assert cleared_client.region_name(None) == ""


# --- the file itself --------------------------------------------------------


def test_database_is_opened_read_only(cleared_client_ctx):
    conn = cleared_client._connect()
    try:
        with pytest.raises(sqlite3.OperationalError):
            conn.execute("INSERT INTO plants VALUES ('x', 'x', 'x')")
    finally:
        conn.close()


def test_unknown_major_schema_version_is_refused(cleared_app, tmp_path):
    path = tmp_path / "v2.sqlite"
    build_db(path, schema_version="2.0.0")
    cleared_app.config["CLEARED_DB_PATH"] = str(path)
    with cleared_app.app_context():
        with pytest.raises(ClearedDataError, match="schema version"):
            cleared_client.search_plants()


def test_higher_minor_schema_version_is_accepted(cleared_app, tmp_path):
    path = tmp_path / "v1_9.sqlite"
    build_db(path, schema_version="1.9.0")
    cleared_app.config["CLEARED_DB_PATH"] = str(path)
    with cleared_app.app_context():
        assert len(cleared_client.search_plants()) == 4


def test_missing_schema_version_is_refused(cleared_app, tmp_path):
    path = tmp_path / "nover.sqlite"
    build_db(path, schema_version=None)
    cleared_app.config["CLEARED_DB_PATH"] = str(path)
    with cleared_app.app_context():
        with pytest.raises(ClearedDataError, match="no schema_version"):
            cleared_client.search_plants()


def test_path_not_configured(app):
    with app.app_context():
        with pytest.raises(ClearedDataError, match="CLEARED_DB_PATH"):
            cleared_client.search_plants()


def test_file_not_found(app, tmp_path):
    app.config["CLEARED_DB_PATH"] = str(tmp_path / "missing.sqlite")
    with app.app_context():
        with pytest.raises(ClearedDataError, match="not found"):
            cleared_client.search_plants()


# --- through the HTTP routes ------------------------------------------------


def test_route_source_cleared(client, cleared_app):
    response = client.get("/api/plants?source=cleared&sunlight=Shade")
    assert response.status_code == 200
    assert names(response.get_json()) == ["Shady fern"]


def test_route_name_search(client, cleared_app):
    response = client.get("/api/plants?source=cleared&q=Sun-Lover%27s")
    assert names(response.get_json()) == ["Sunny coneflower"]


def test_route_name_search_is_ignored_by_the_other_sources(client):
    assert len(client.get("/api/plants?source=mock&q=zzzz").get_json()) == 15


def test_route_native_filter_and_region(client, cleared_app):
    assert names(client.get("/api/plants?source=cleared&native=true").get_json()) == ["Sunny coneflower"]
    assert client.get("/api/plants?source=cleared&native=true&region=US-VA").get_json() == []
    detail = client.get(f"/api/plants/{SUNNY}?source=cleared&region=US-VA").get_json()
    assert detail["nativity"] == "introduced"


def test_route_ids(client, cleared_app):
    found = client.get(f"/api/plants?source=cleared&ids={SUNNY},{TOMATO}").get_json()
    assert names(found) == ["Sunny coneflower", "Tomato crop"]
    assert client.get("/api/plants?source=cleared&ids=").get_json() == []


def test_route_zip_lookup(client, cleared_app):
    response = client.get("/api/regions/zip/20850")
    assert response.status_code == 200
    assert response.get_json()["county"] == "Montgomery County"
    assert client.get("/api/regions/zip/99999").status_code == 404
    bad = client.get("/api/regions/zip/12")
    assert bad.status_code == 400
    assert "five digits" in bad.get_json()["error"]


def test_route_zip_lookup_reports_missing_data_as_502(client):
    assert client.get("/api/regions/zip/20850").status_code == 502


def test_route_detail_and_unknown_id(client, cleared_app):
    assert client.get(f"/api/plants/{SUNNY}?source=cleared").get_json()["commonName"] == "Sunny coneflower"
    missing = client.get("/api/plants/no-such-id?source=cleared")
    assert missing.status_code == 404
    assert "no-such-id" in missing.get_json()["error"]


def test_route_uses_the_configured_default_source(client, cleared_app):
    cleared_app.config["PLANT_DATA_SOURCE"] = "cleared"
    assert len(client.get("/api/plants").get_json()) == 4


def test_request_source_overrides_the_configured_default(client, cleared_app):
    cleared_app.config["PLANT_DATA_SOURCE"] = "cleared"
    fixtures = client.get("/api/plants?source=mock").get_json()
    assert len(fixtures) == 15  # the Perenual mock fixtures, not the 4 cleared plants


def test_route_old_mock_parameter_still_selects_the_fixtures(client):
    assert len(client.get("/api/plants?mock=true").get_json()) == 15


def test_route_rejects_an_unknown_source(client):
    response = client.get("/api/plants?source=nope")
    assert response.status_code == 400
    assert "cleared" in response.get_json()["error"]


def test_route_reports_cleared_data_problems_as_502(client):
    response = client.get("/api/plants?source=cleared")  # CLEARED_DB_PATH is not set in tests
    assert response.status_code == 502
    assert "CLEARED_DB_PATH" in response.get_json()["error"]
