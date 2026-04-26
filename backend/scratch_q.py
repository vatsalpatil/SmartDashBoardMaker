import requests
import time

ds = 'e875cefe-c048-4cb4-abbf-61b4809794a8'

def fetch():
    res = requests.post(
        'http://localhost:8000/api/queries/execute', 
        json={'sql': f'SELECT * FROM dataset_{ds.replace("-","_")}', 'dataset_id': ds}
    ).json()
    if 'rows' in res and res['rows']:
        return res['rows'][0]
    return res

print('R1:', fetch())
time.sleep(3)
print('R2:', fetch())
