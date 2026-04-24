import json
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from models.database import get_db
import uuid

router = APIRouter(prefix="/api/visualizations", tags=["visualizations"])

class VisualizationBase(BaseModel):
    name: str
    dataset_id: str
    query_id: Optional[str] = None
    chart_type: str
    config: dict  # Native object support

@router.get("/")
async def list_visualizations(dataset_id: Optional[str] = None):
    with get_db() as conn:
        if dataset_id:
            cursor = conn.execute("SELECT * FROM visualizations WHERE dataset_id = ?", (dataset_id,))
        else:
            cursor = conn.execute("SELECT * FROM visualizations ORDER BY created_at DESC")
        
        rows = []
        for row in cursor.fetchall():
            d = dict(row)
            try: d['config'] = json.loads(d['config'])
            except: pass
            rows.append(d)
        return {"visualizations": rows}

@router.get("/{viz_id}")
async def get_visualization(viz_id: str):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM visualizations WHERE id = ?", (viz_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Visualization not found")
        
        d = dict(row)
        try: d['config'] = json.loads(d['config'])
        except: pass
        return d

@router.post("/")
async def save_visualization(viz: VisualizationBase):
    with get_db() as conn:
        # Check for existing visualization by name
        cursor = conn.execute("SELECT id FROM visualizations WHERE name = ?", (viz.name,))
        existing = cursor.fetchone()
        
        if existing:
            viz_id = existing['id']
            conn.execute("""
                UPDATE visualizations 
                SET dataset_id = ?, query_id = ?, chart_type = ?, config = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (viz.dataset_id, viz.query_id, viz.chart_type, json.dumps(viz.config), viz_id))
            return {"id": viz_id, **viz.dict()}
        else:
            viz_id = str(uuid.uuid4())
            conn.execute("""
                INSERT INTO visualizations (id, name, dataset_id, query_id, chart_type, config)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (viz_id, viz.name, viz.dataset_id, viz.query_id, viz.chart_type, json.dumps(viz.config)))
            return {"id": viz_id, **viz.dict()}

@router.put("/{viz_id}")
async def update_visualization(viz_id: str, viz: VisualizationBase):
    with get_db() as conn:
        conn.execute("""
            UPDATE visualizations 
            SET name = ?, chart_type = ?, config = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (viz.name, viz.chart_type, json.dumps(viz.config), viz_id))
        return {"id": viz_id, **viz.dict()}

@router.delete("/{viz_id}")
async def delete_visualization(viz_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM visualizations WHERE id = ?", (viz_id,))
        return {"status": "success"}
