"""Tests del API con httpx.AsyncClient sobre la app real (DB SQLite de test)."""

from tests.conftest import sample_report


async def test_health_ok_con_db_vacia(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["runs_count"] == 0


async def test_ingest_y_latest(client):
    # Ingerimos un reporte...
    resp = await client.post("/api/v1/ingest", params={"run_id": "run-api"}, json=sample_report())
    assert resp.status_code == 200
    body = resp.json()
    assert body["ingested"] is True
    assert body["run"]["run_id"] == "run-api"
    assert body["run"]["total"] == 2

    # ...y lo leemos por /runs/latest con sus resultados.
    latest = await client.get("/api/v1/runs/latest")
    assert latest.status_code == 200
    data = latest.json()
    assert data["run_id"] == "run-api"
    assert len(data["results"]) == 2


async def test_runs_list_y_health_cuenta(client):
    await client.post("/api/v1/ingest", params={"run_id": "run-a"}, json=sample_report())
    await client.post("/api/v1/ingest", params={"run_id": "run-b"}, json=sample_report())

    runs = await client.get("/api/v1/runs")
    assert runs.status_code == 200
    assert len(runs.json()) == 2

    health = await client.get("/api/v1/health")
    assert health.json()["runs_count"] == 2


async def test_run_inexistente_da_404(client):
    resp = await client.get("/api/v1/runs/no-existe")
    assert resp.status_code == 404
