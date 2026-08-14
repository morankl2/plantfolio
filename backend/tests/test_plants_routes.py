from unittest.mock import patch


SAMPLE_PLANT = {
    "id": "1",
    "commonName": "European Silver Fir",
    "latinName": "Abies alba",
    "imageUrl": "https://example.com/img.jpg",
    "sunlight": "Full Sun",
    "soilTypes": [],
    "zones": "3–9",
    "native": False,
    "flowering": False,
    "edible": False,
    "description": "A tall conifer.",
    "water": "Average",
    "matureSize": "Unknown",
    "bloomSeason": "Unknown",
    "tags": [],
}


@patch("app.routes.plants.search_plants")
def test_list_plants_returns_json(mock_search, client):
    mock_search.return_value = [SAMPLE_PLANT]

    response = client.get("/api/plants?sunlight=Full+Sun&zone=7")

    assert response.status_code == 200
    assert response.get_json() == [SAMPLE_PLANT]
    mock_search.assert_called_once_with(sunlight=["Full Sun"], edible=None, zone="7")


@patch("app.routes.plants.search_plants")
def test_list_plants_surfaces_upstream_errors(mock_search, client):
    from app.perenual_client import PerenualError

    mock_search.side_effect = PerenualError("boom")

    response = client.get("/api/plants")

    assert response.status_code == 502
    assert "boom" in response.get_json()["error"]


@patch("app.routes.plants.get_plant_details")
def test_get_plant_returns_json(mock_details, client):
    mock_details.return_value = SAMPLE_PLANT

    response = client.get("/api/plants/1")

    assert response.status_code == 200
    assert response.get_json() == SAMPLE_PLANT
    mock_details.assert_called_once_with("1")
