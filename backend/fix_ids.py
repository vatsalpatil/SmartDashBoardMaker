import sqlite3
import json

def fix_dashboard_ids():
    conn = sqlite3.connect('metadata.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all valid visualization IDs
    cursor.execute("SELECT id, name FROM visualizations")
    valid_vizs = {v['id']: v['name'] for v in cursor.fetchall()}
    print(f"Found {len(valid_vizs)} valid visualizations.")

    # Get all dashboards
    cursor.execute("SELECT id, name, widgets, layout FROM dashboards")
    dashboards = cursor.fetchall()
    print(f"Found {len(dashboards)} dashboards.")

    for dash in dashboards:
        dash_id = dash['id']
        widgets = json.loads(dash['widgets'])
        layout = json.loads(dash['layout'])
        changed = False

        new_widgets = []
        for w in widgets:
            viz_id = w.get('viz_id')
            if viz_id not in valid_vizs:
                print(f"Mangled ID found in dash '{dash['name']}': {viz_id}")
                # Try to find a match by prefix or similar length
                match = None
                for valid_id in valid_vizs:
                    # Check if the mangled ID is a substring or very similar
                    if viz_id[:10] == valid_id[:10]:
                        match = valid_id
                        break
                
                if match:
                    print(f"  -> Fixing {viz_id} to {match} (Match: {valid_vizs[match]})")
                    w['viz_id'] = match
                    # Also fix layout if it uses the same ID
                    for l in layout:
                        if l.get('i') == viz_id:
                            l['i'] = match
                    changed = True
                else:
                    print(f"  !! No match found for {viz_id}")
            new_widgets.append(w)

        if changed:
            print(f"Updating dashboard '{dash['name']}'...")
            cursor.execute(
                "UPDATE dashboards SET widgets = ?, layout = ? WHERE id = ?",
                (json.dumps(new_widgets), json.dumps(layout), dash_id)
            )

    conn.commit()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    fix_dashboard_ids()
