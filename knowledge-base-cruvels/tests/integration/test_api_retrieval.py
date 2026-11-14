"""Integration tests for FastAPI endpoints."""


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True


def test_metadata_stats_endpoint(client):
    response = client.get("/v1/metadata/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_provisions"] >= 7
    assert data["central_provisions"] >= 6


def test_list_instruments_endpoint(client):
    response = client.get("/v1/instruments?jurisdiction=central")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 4
    titles = [i["title"] for i in data["items"]]
    assert any("Bharatiya Nagarik Suraksha Sanhita" in t for t in titles)


def test_exact_resolution_bnss_193(client):
    response = client.get("/v1/provisions/resolve?act=Bharatiya%20Nagarik%20Suraksha%20Sanhita,%202023&section=193")
    assert response.status_code == 200
    data = response.json()
    assert data["section_number_norm"] == "193"
    assert "Report of police officer" in data["section_title"]
    assert "Every investigation under this Chapter shall be completed" in data["source_text"]
    assert len(data["canonical_hash"]) == 64


def test_exact_resolution_lettered_section_53A(client):
    response = client.get("/v1/provisions/resolve?act=Bharatiya%20Nagarik%20Suraksha%20Sanhita&section=53A")
    assert response.status_code == 200
    data = response.json()
    assert data["section_number_norm"] == "53A"
    assert "Examination of person accused of rape" in data["section_title"]


def test_exact_resolution_nonexistent_section_returns_404(client):
    response = client.get("/v1/provisions/resolve?act=Bharatiya%20Nagarik%20Suraksha%20Sanhita&section=99999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "ProvisionNotFound"


def test_full_text_search_endpoint(client):
    response = client.get("/v1/search?q=investigation%20report")
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] >= 1
    sections = [r["section_number_norm"] for r in data["results"]]
    assert "193" in sections
