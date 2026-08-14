from unittest.mock import Mock, patch

import pytest

from app.perenual_client import PerenualError, get_plant_details, normalize_plant, search_plants


def _species(id_, common_name="European Silver Fir", sunlight=None):
    return {
        "id": id_,
        "common_name": common_name,
        "scientific_name": ["Abies alba"],
        "default_image": {"regular_url": "https://example.com/img.jpg"},
        "sunlight": sunlight or ["full_sun"],
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


def test_normalize_plant_defaults_when_hardiness_missing():
    plant = normalize_plant(_species(1))
    assert plant["zones"] == "Unknown"


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
