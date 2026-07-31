import os
from typing import Any

from catworld import CatworldClient
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="77System Catworld Service")


class CatworldCredentials(BaseModel):
    base_url: str = Field(min_length=1)
    token: str = Field(min_length=1)


class QueryRequest(CatworldCredentials):
    sql: str = Field(min_length=1)
    dataset_id: str | None = None
    project_id: str | None = None
    timeout: int = 30
    limit: int = 10000


class DatasetRequest(CatworldCredentials):
    dataset_id: str


class SourceRequest(CatworldCredentials):
    source_id: str


def client(credentials: CatworldCredentials) -> CatworldClient:
    timeout = int(os.getenv("CATWORLD_TIMEOUT", "30"))
    return CatworldClient(credentials.base_url, credentials.token, timeout=timeout)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "catworld-service"}


@app.post("/projects")
def projects(credentials: CatworldCredentials) -> Any:
    try:
        with client(credentials) as catworld:
            return catworld.projects()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/datasets")
def datasets(credentials: CatworldCredentials) -> Any:
    try:
        with client(credentials) as catworld:
            return catworld.datasets()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/tables")
def tables(request: DatasetRequest) -> Any:
    try:
        with client(request) as catworld:
            return catworld.tables(request.dataset_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/query")
def query(request: QueryRequest) -> Any:
    try:
        with client(request) as catworld:
            result = catworld.query(
                request.sql,
                dataset_id=request.dataset_id,
                project_id=request.project_id,
                timeout=request.timeout,
                limit=request.limit,
            )
            return {"columns": result.columns, "rows": result.rows}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/refresh-source")
def refresh_source(request: SourceRequest) -> Any:
    try:
        with client(request) as catworld:
            return catworld.refresh_source(request.source_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
