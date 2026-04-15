import sqlite3
import json

def final_fix():
    conn = sqlite3.connect('metadata.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all visualizations
    cursor.execute("SELECT id, name FROM visualizations")
    vizs = {v['id']: v['name'] for v in cursor.fetchall()}
    
    # Get all dashboards
    cursor.execute("SELECT id, name, widgets, layout FROM dashboards")
    dashboards = cursor.fetchall()
    
    for dash in dashboards:
        print(f"\nProcessing Dashboard: {dash['name']}")
        widgets = json.loads(dash['widgets'])
        layout = json.loads(dash['layout'])
        changed = False
        
        for w in widgets:
            old_id = w.get('viz_id')
            if not old_id: continue
            
            if old_id not in vizs:
                print(f"  Mangled ID: {old_id} (len {len(old_id)})")
                # Find best fuzzy match
                match = None
                # Try name match if possible (but we don't have name in widget)
                # Try prefix-based fuzzy match
                for vid in vizs:
                    if vid.startswith(old_id[:8]): # First 8 chars
                        match = vid
                        break
                
                if match:
                    print(f"  FOUND MATCH: {match} ({vizs[match]})")
                    w['viz_id'] = match
                    # Update layout
                    for l in layout:
                        if l.get('i') == old_id:
                            l['i'] = match
                    changed = True
                else:
                    print(f"  NO MATCH FOUND for {old_id}")
            else:
                print(f"  Valid ID: {old_id} ({vizs[old_id]})")

        if changed:
            print("  Updating dashboard in DB...")
            cursor.execute(
                "UPDATE dashboards SET widgets = ?, layout = ? WHERE id = ?",
                (json.dumps(widgets), json.dumps(layout), dash['id'])
            )

    conn.commit()
    conn.close()

if __name__ == "__main__":
    final_fix()
