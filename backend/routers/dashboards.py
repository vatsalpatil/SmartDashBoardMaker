import json
from fastapi import APIRouter, HTTPException, Depends
from auth.dependencies import get_current_user
from typing import List, Optional, Any
from pydantic import BaseModel
from models.database import get_db
import uuid

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])

class DashboardBase(BaseModel):
    name: str
    description: Optional[str] = ""
    layout: Optional[Any] = []
    widgets: Optional[Any] = []
    tabs: Optional[Any] = []
    global_filters: Optional[Any] = []

class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    layout: Optional[Any] = None
    widgets: Optional[Any] = None
    tabs: Optional[Any] = None
    global_filters: Optional[Any] = None

@router.get("/")
def list_dashboards(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM dashboards WHERE user_id = ? ORDER BY created_at DESC", (current_user["id"],))
        rows = []
        for row in cursor.fetchall():
            d = dict(row)
            try: d['layout'] = json.loads(d['layout']) if d.get('layout') else []
            except: d['layout'] = []
            try: d['widgets'] = json.loads(d['widgets']) if d.get('widgets') else []
            except: d['widgets'] = []
            try: d['tabs'] = json.loads(d['tabs']) if d.get('tabs') else []
            except: d['tabs'] = []
            try: d['global_filters'] = json.loads(d['global_filters']) if d.get('global_filters') else []
            except: d['global_filters'] = []
            rows.append(d)
        return {"dashboards": rows}

@router.get("/{dashboard_id}")
def get_dashboard(dashboard_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM dashboards WHERE id = ? AND user_id = ?", (dashboard_id, current_user["id"]))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        
        d = dict(row)
        try: d['layout'] = json.loads(d['layout']) if d.get('layout') else []
        except: d['layout'] = []
        try: d['widgets'] = json.loads(d['widgets']) if d.get('widgets') else []
        except: d['widgets'] = []
        try: d['tabs'] = json.loads(d['tabs']) if d.get('tabs') else []
        except: d['tabs'] = []
        try: d['global_filters'] = json.loads(d['global_filters']) if d.get('global_filters') else []
        except: d['global_filters'] = []
        return d

@router.post("/")
def save_dashboard(db: DashboardBase, current_user: dict = Depends(get_current_user)):
    db_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("""
            INSERT INTO dashboards (id, user_id, name, description, layout, widgets, tabs, global_filters)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            db_id,
            current_user["id"],
            db.name, 
            db.description, 
            json.dumps(db.layout), 
            json.dumps(db.widgets), 
            json.dumps(db.tabs),
            json.dumps(db.global_filters)
        ))
        cursor = conn.execute("SELECT * FROM dashboards WHERE id = ? AND user_id = ?", (db_id, current_user["id"]))
        row = cursor.fetchone()
        d = dict(row)
        d['layout'] = json.loads(d['layout'])
        d['widgets'] = json.loads(d['widgets'])
        d['tabs'] = json.loads(d['tabs'])
        d['global_filters'] = json.loads(d['global_filters'])
        return d

@router.put("/{dashboard_id}")
def update_dashboard(dashboard_id: str, db: DashboardUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM dashboards WHERE id = ? AND user_id = ?", (dashboard_id, current_user["id"]))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        
        existing = dict(row)
        
        name = db.name if db.name is not None else existing['name']
        desc = db.description if db.description is not None else existing['description']
        
        layout_json = json.dumps(db.layout) if db.layout is not None else existing['layout']
        widgets_json = json.dumps(db.widgets) if db.widgets is not None else existing['widgets']
        tabs_json = json.dumps(db.tabs) if db.tabs is not None else existing['tabs']
        filters_json = json.dumps(db.global_filters) if db.global_filters is not None else existing['global_filters']

        conn.execute("""
            UPDATE dashboards 
            SET name = ?, description = ?, layout = ?, widgets = ?, tabs = ?, global_filters = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        """, (name, desc, layout_json, widgets_json, tabs_json, filters_json, dashboard_id, current_user["id"]))
        
        cursor = conn.execute("SELECT * FROM dashboards WHERE id = ? AND user_id = ?", (dashboard_id, current_user["id"]))
        row = cursor.fetchone()
        d = dict(row)
        d['layout'] = json.loads(d['layout'])
        d['widgets'] = json.loads(d['widgets'])
        d['tabs'] = json.loads(d['tabs'])
        d['global_filters'] = json.loads(d['global_filters'])
        return d

@router.delete("/{dashboard_id}")
def delete_dashboard(dashboard_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("DELETE FROM dashboards WHERE id = ? AND user_id = ?", (dashboard_id, current_user["id"]))
        return {"status": "success"}
