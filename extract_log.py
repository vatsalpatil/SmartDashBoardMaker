import re

log_path = r"C:\Users\Vatsal\.gemini\antigravity\brain\bf3e0a18-ca5a-457a-a585-99dbb988af52\.system_generated\logs\overview.txt"

with open(log_path, "r", encoding="utf-8") as f:
    text = f.read()

# The system saves the complete file content in "view_file" or "write_to_file" calls
# Let's find all instances of viewing ChartPreview.jsx. 
view_blocks = []
for match in re.finditer(r"Showing lines (\d+) to (\d+).*?(\d+): (.*?)(?=\n.*\n.*Showing lines|\Z)", text, re.DOTALL):
    pass
# It's easier to find "Created file file:///...ChartPreview.jsx with requested content" and get what was written
writes = []
for m in re.finditer(r'write_to_file({.*?TargetFile:.*ChartPreview.jsx.*?})', text, re.DOTALL):
    writes.append(m.group(0))

print(f"Found {len(writes)} writes to ChartPreview.jsx")
for i, w in enumerate(writes[-3:]):
    print(f"Write {i+1}: length = {len(w)}")
