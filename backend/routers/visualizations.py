import json
from fastapi import APIRouter, HTTPException, Depends
from auth.dependencies import get_current_user
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
def list_visualizations(dataset_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if dataset_id:
            cursor = conn.execute("SELECT * FROM visualizations WHERE dataset_id = ? AND user_id = ?", (dataset_id, current_user["id"]))
        else:
            cursor = conn.execute("SELECT * FROM visualizations WHERE user_id = ? ORDER BY created_at DESC", (current_user["id"],))
        
        rows = []
        for row in cursor.fetchall():
            d = dict(row)
            try: d['config'] = json.loads(d['config'])
            except: pass
            rows.append(d)
        return {"visualizations": rows}

@router.get("/{viz_id}")
def get_visualization(viz_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM visualizations WHERE id = ? AND user_id = ?", (viz_id, current_user["id"]))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Visualization not found")
        
        d = dict(row)
        try: d['config'] = json.loads(d['config'])
        except: pass
        return d

@router.post("/")
def save_visualization(viz: VisualizationBase, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        # Check for existing visualization by name
        cursor = conn.execute("SELECT id FROM visualizations WHERE name = ? AND user_id = ?", (viz.name, current_user["id"]))
        existing = cursor.fetchone()
        
        if existing:
            viz_id = existing['id']
            conn.execute("""
                UPDATE visualizations 
                SET dataset_id = ?, query_id = ?, chart_type = ?, config = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            """, (viz.dataset_id, viz.query_id, viz.chart_type, json.dumps(viz.config), viz_id, current_user["id"]))
            return {"id": viz_id, **viz.dict()}
        else:
            viz_id = str(uuid.uuid4())
            conn.execute("""
                INSERT INTO visualizations (id, user_id, name, dataset_id, query_id, chart_type, config)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (viz_id, current_user["id"], viz.name, viz.dataset_id, viz.query_id, viz.chart_type, json.dumps(viz.config)))
            return {"id": viz_id, **viz.dict()}

@router.put("/{viz_id}")
def update_visualization(viz_id: str, viz: VisualizationBase, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("""
            UPDATE visualizations 
            SET name = ?, chart_type = ?, config = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        """, (viz.name, viz.chart_type, json.dumps(viz.config), viz_id, current_user["id"]))
        return {"id": viz_id, **viz.dict()}

@router.delete("/{viz_id}")
def delete_visualization(viz_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("DELETE FROM visualizations WHERE id = ? AND user_id = ?", (viz_id, current_user["id"]))
        return {"status": "success"}
