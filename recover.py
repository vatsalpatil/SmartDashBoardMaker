import os
import glob

history_dir = os.path.expandvars(r"%APPDATA%\Code\User\History")
print(f"Searching in: {history_dir}")

candidates = []
for root, dirs, files in os.walk(history_dir):
    for f in files:
        if f == "entries.json":
            continue
        filepath = os.path.join(root, f)
        try:
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()
                if "export default function ChartPreview" in content:
                    candidates.append((filepath, len(content), os.path.getmtime(filepath)))
        except Exception as e:
            pass

candidates.sort(key=lambda x: x[2], reverse=True)
print(f"Found {len(candidates)} versions of ChartPreview")
for i, c in enumerate(candidates[:10]):
    print(f"[{i}] {c[0]} - Length: {c[1]} - MTime: {c[2]}")
    
# Save the best candidate (largest one around 44-46KB) to a tmp file
for c in candidates[:10]:
    if 40000 < c[1] < 50000:
        print(f"Extracting {c[0]} as the likely original file")
        with open(c[0], "r", encoding="utf-8") as file:
            with open("C:/Users/Vatsal/Document/VSCodeFiles/PythonCode/SmartDashBoardMaker/frontend/src/components/visualizations/ChartPreview_recovered.jsx", "w", encoding="utf-8") as out:
                out.write(file.read())
        break
