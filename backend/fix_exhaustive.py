import sqlite3
import json

def fix_dashboard_ids_exhaustive():
    conn = sqlite3.connect('metadata.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all valid visualization IDs and names
    cursor.execute("SELECT id, name FROM visualizations")
    valid_vizs = {v['id']: v['name'] for v in cursor.fetchall()}
    print(f"Valid IDs in DB ({len(valid_vizs)}):")
    for vid, name in valid_vizs.items():
        print(f"  {vid} ({len(vid)}) -> {name}")

    # Get all dashboards
    cursor.execute("SELECT id, name, widgets FROM dashboards")
    dashboards = cursor.fetchall()
    
    for dash in dashboards:
        print(f"\nChecking dashboard: {dash['name']} (ID: {dash['id']})")
        widgets = json.loads(dash['widgets'])
        layout = json.loads(dash['widgets']) # wait, I should load layout too if I'm fixing it
        
        # Reload full dash data
        cursor.execute("SELECT layout FROM dashboards WHERE id = ?", (dash['id'],))
        layout = json.loads(cursor.fetchone()['layout'])
        
        changed = False
        for w in widgets:
            viz_id = w.get('viz_id')
            if not viz_id: continue
            
            print(f"  Widget Viz ID: {viz_id} ({len(viz_id)})")
            if viz_id in valid_vizs:
                print("    [OK]")
            else:
                print(f"    [MISSING/MANGLED] Looking for match...")
                # Try prefix-based match
                match = None
                prefix = viz_id[:20] # Take first 20 chars
                for vid in valid_vizs:
                    if vid.startswith(prefix):
                        match = vid
                        break
                
                # If no prefix match, try fuzzy matching (same suffix or high similarity)
                if not match:
                    for vid in valid_vizs:
                        if vid.endswith(viz_id[-8:]): # Match last 8 chars
                            match = vid
                            break
                
                if match:
                    print(f"    FOUND MATCH: {match} ({valid_vizs[match]})")
                    w['viz_id'] = match
                    # Update layout as well
                    for l in layout:
                        if l.get('i') == viz_id:
                            l['i'] = match
                    changed = True
                else:
                    print(f"    FAILED TO FIND MATCH for {viz_id}")

        if changed:
            print(f"  Updating dashboard widgets in DB...")
            cursor.execute(
                "UPDATE dashboards SET widgets = ?, layout = ? WHERE id = ?",
                (json.dumps(widgets), json.dumps(layout), dash['id'])
            )

    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_dashboard_ids_exhaustive()
