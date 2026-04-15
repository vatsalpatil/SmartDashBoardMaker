import requests

url = "http://localhost:8000/api/visualizations/c2fcc3d7-3f29-4bfe-8411-33ec3b281ca7"
payload = {
    "name": "City Wise Profit & Revenue Chart",
    "dataset_id": "test",
    "chart_type": "bar",
    "config": {
        "x_field": "city",
        "y_fields": ["profit", "revenue"],
        "chart_type": "bar",
        "source_type": "dataset"
    }
}
resp = requests.put(url, json=payload)
print(resp.status_code)
print(resp.text)
