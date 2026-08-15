from unittest.mock import Mock, patch

import pytest

from app.perenual_client import PerenualError, get_plant_details, normalize_plant, search_plants


def _species(id_, common_name="European Silver Fir", sunlight=None):
    return {
        "id": id_,
        "common_name": common_name,
        "scientific_name": ["Abies alba"],
        "default_image": {"regular_url": "https://example.com/img.jpg"},
        # Real Perenual data is space-separated and inconsistently cased
        # ("full sun", "Full sun", "part shade", "filtered shade" have all
        # been observed) rather than the underscored enum the filter param
        # uses, so tests exercise that real-world format.
        "sunlight": sunlight or ["full sun"],
    }


def _details(id_, zone_min, zone_max):
    return {
        "id": id_,
        "common_name": "European Silver Fir",
        "scientific_name": ["Abies alba"],
        "description": "A tall conifer.",
        "hardiness": {"min": str(zone_min), "max": str(zone_max)},
        "default_image": {"regular_url": "https://example.com/img.jpg"},
        "watering": "Average",
    }


def test_normalize_plant_maps_expected_fields():
    plant = normalize_plant(_species(1), _details(1, 3, 9))

    assert plant["id"] == "1"
    assert plant["commonName"] == "European Silver Fir"
    assert plant["latinName"] == "Abies alba"
    assert plant["zones"] == "3–9"
    assert plant["imageUrl"] == "https://example.com/img.jpg"
    assert plant["water"] == "Average"
    assert plant["sunlight"] == "Full Sun"


def test_normalize_plant_defaults_when_hardiness_missing():
    plant = normalize_plant(_species(1))
    assert plant["zones"] == "Unknown"


@pytest.mark.parametrize(
    "raw,expected",
    [
        (["full sun"], "Full Sun"),
        (["Full sun"], "Full Sun"),
        (["full_sun"], "Full Sun"),
        (["part shade"], "Partial"),
        (["filtered shade"], "Shade"),
        (["full shade"], "Shade"),
        (None, "Partial"),
        ([], "Partial"),
    ],
)
def test_normalize_plant_sunlight_matches_real_perenual_formats(raw, expected):
    species = _species(1)
    species["sunlight"] = raw  # bypass _species()'s default-if-falsy fallback
    plant = normalize_plant(species)
    assert plant["sunlight"] == expected


def test_normalize_plant_common_name_is_title_cased():
    plant = normalize_plant(_species(1, common_name="european silver fir"))
    assert plant["commonName"] == "European Silver Fir"


def test_normalize_plant_mature_size_from_dimensions():
    species = _species(1)
    species["dimensions"] = [{"type": "Height", "min_value": 45, "max_value": 60, "unit": "feet"}]
    plant = normalize_plant(species)
    assert plant["matureSize"] == "Height: 45–60 feet"


def test_normalize_plant_mature_size_unknown_when_no_dimensions():
    plant = normalize_plant(_species(1))
    assert plant["matureSize"] == "Unknown"


def test_normalize_plant_soil_types_are_trimmed():
    species = _species(1)
    species["soil"] = ["Acidic", " Rocky ", " gravelly ", ""]
    plant = normalize_plant(species)
    assert plant["soilTypes"] == ["Acidic", "Rocky", "gravelly"]


@patch("app.perenual_client.requests.get")
def test_search_plants_without_zone_skips_detail_calls(mock_get, app):
    mock_get.return_value = Mock(
        status_code=200,
        json=lambda: {"data": [_species(1), _species(2)], "last_page": 1},
    )
    mock_get.return_value.raise_for_status = Mock()

    with app.app_context():
        results = search_plants(sunlight=["Full Sun"])

    assert len(results) == 2
    assert mock_get.call_count == 1
    called_params = mock_get.call_args.kwargs["params"]
    assert called_params["sunlight"] == "full_sun"


@patch("app.perenual_client.requests.get")
def test_search_plants_zone_filters_out_of_range_candidates(mock_get, app):
    def fake_get(url, params, timeout):
        response = Mock()
        response.raise_for_status = Mock()
        if url.endswith("/species-list"):
            response.json = lambda: {
                "data": [_species(1), _species(2)],
                "last_page": 1,
            }
        elif url.endswith("/species/details/1"):
            response.json = lambda: _details(1, 5, 9)  # includes zone 7
        elif url.endswith("/species/details/2"):
            response.json = lambda: _details(2, 9, 10)  # excludes zone 7
        return response

    mock_get.side_effect = fake_get

    with app.app_context():
        results = search_plants(zone="7")

    assert [p["id"] for p in results] == ["1"]


@patch("app.perenual_client.requests.get")
def test_search_plants_zone_caps_detail_calls_at_ten(mock_get, app):
    detail_calls = []

    def fake_get(url, params, timeout):
        response = Mock()
        response.raise_for_status = Mock()
        if url.endswith("/species-list"):
            response.json = lambda: {
                "data": [_species(i) for i in range(1, 16)],  # 15 candidates
                "last_page": 1,
            }
        else:
            detail_calls.append(url)
            response.json = lambda: _details(1, 5, 9)
        return response

    mock_get.side_effect = fake_get

    with app.app_context():
        search_plants(zone="7")

    assert len(detail_calls) == 10


@patch("app.perenual_client.requests.get")
def test_search_plants_zone_pulls_multiple_list_pages(mock_get, app):
    list_pages_requested = []

    def fake_get(url, params, timeout):
        response = Mock()
        response.raise_for_status = Mock()
        if url.endswith("/species-list"):
            list_pages_requested.append(params["page"])
            response.json = lambda: {
                "data": [_species(params["page"] * 100 + i) for i in range(30)],
                "last_page": 5,  # plenty more pages available than we should fetch
            }
        else:
            response.json = lambda: _details(1, 5, 9)
        return response

    mock_get.side_effect = fake_get

    with app.app_context():
        search_plants(zone="7")

    assert list_pages_requested == [1, 2, 3]


@patch("app.perenual_client.requests.get")
def test_get_plant_details(mock_get, app):
    mock_get.return_value = Mock(
        status_code=200, json=lambda: _details(1, 4, 8)
    )
    mock_get.return_value.raise_for_status = Mock()

    with app.app_context():
        plant = get_plant_details("1")

    assert plant["zones"] == "4–8"


def test_missing_api_key_raises_perenual_error(app):
    app.config["PERENUAL_API_KEY"] = ""
    with app.app_context():
        with pytest.raises(PerenualError):
            search_plants()


@patch("app.perenual_client.requests.get")
def test_rate_limit_raises_friendly_message(mock_get, app):
    import requests

    response = Mock(status_code=429)
    http_error = requests.HTTPError(response=response)
    response.raise_for_status = Mock(side_effect=http_error)
    mock_get.return_value = response

    with app.app_context():
        with pytest.raises(PerenualError, match="API limit exceeded at the moment. Please try again in 1 hour"):
            search_plants()


@patch("app.perenual_client.requests.get")
def test_mock_mode_never_calls_the_network(mock_get, app):
    app.config["MOCK_PERENUAL"] = True

    with app.app_context():
        results = search_plants()
        assert len(results) == 15  # all of MOCK_SPECIES

        edible_only = search_plants(edible=True)
        assert all(p["edible"] for p in edible_only)

        zone_7 = search_plants(zone="7")
        assert all(p["zones"] != "Unknown" for p in zone_7)

        detail = get_plant_details("1")
        assert detail["commonName"] == "European Silver Fir"

    mock_get.assert_not_called()


def test_mock_mode_unknown_id_raises_perenual_error(app):
    app.config["MOCK_PERENUAL"] = True
    with app.app_context():
        with pytest.raises(PerenualError):
            get_plant_details("does-not-exist")
