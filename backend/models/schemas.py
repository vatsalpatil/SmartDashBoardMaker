"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any
from datetime import datetime


# ── Dataset Schemas ──────────────────────────────────────────────

class ColumnInfo(BaseModel):
    name: str
    dtype: str


class DatasetResponse(BaseModel):
    id: str
    name: str
    original_filename: str
    file_size: int
    row_count: int
    columns: List[ColumnInfo]
    is_virtual: Optional[bool] = False
    created_at: str
    updated_at: str


class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    total: int


class DataPreviewResponse(BaseModel):
    columns: List[str]
    rows: List[dict]
    total_rows: int
    page: int
    page_size: int


# ── Query Schemas ────────────────────────────────────────────────

class QueryRequest(BaseModel):
    sql: str
    dataset_id: str
    page: int = 1
    page_size: int = 50


class QueryResult(BaseModel):
    columns: List[str]
    rows: List[dict]
    total_rows: int
    page: int
    page_size: int
    execution_time_ms: float


class SaveQueryRequest(BaseModel):
    name: str
    description: str = ""
    sql: str
    dataset_id: str
    config: Optional[str] = None
    id: Optional[str] = None


class SavedQueryResponse(BaseModel):
    id: str
    name: str
    description: str
    sql_text: str
    dataset_id: str
    config: Optional[str] = None
    created_at: str
    updated_at: str


# ── Visualization Schemas ────────────────────────────────────────

class VisualizationConfig(BaseModel):
    model_config = ConfigDict(extra='allow')
    x_field: Optional[str] = None
    y_field: Optional[str] = None
    y_fields: Optional[List[str]] = None
    aggregation: Optional[str] = None  # sum, avg, count, min, max
    group_by: Optional[str] = None
    filters: Optional[List[dict]] = []
    colors: Optional[List[str]] = None
    title: Optional[str] = None
    custom_sql: Optional[str] = None


class CreateVisualizationRequest(BaseModel):
    name: str
    dataset_id: str
    query_id: Optional[str] = None
    chart_type: str  # kpi, line, bar, pie, area, table
    config: VisualizationConfig


class VisualizationResponse(BaseModel):
    id: str
    name: str
    dataset_id: str
    query_id: Optional[str]
    chart_type: str
    config: dict
    created_at: str
    updated_at: str


# ── Dashboard Schemas ────────────────────────────────────────────

class DashboardWidget(BaseModel):
    viz_id: str
    layout: dict  # {x, y, w, h}
    overrides: Optional[dict] = {}


class CreateDashboardRequest(BaseModel):
    name: str
    description: str = ""
    widgets: List[DashboardWidget] = []
    global_filters: List[dict] = []


class UpdateDashboardRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    layout: Optional[List[dict]] = None
    widgets: Optional[List[dict]] = None
    global_filters: Optional[List[dict]] = None


class DashboardResponse(BaseModel):
    id: str
    name: str
    description: str
    layout: list
    widgets: list
    global_filters: list
    created_at: str
    updated_at: str
