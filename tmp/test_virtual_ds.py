from backend.services.data_service import get_dataset, list_datasets

print("Listing datasets...")
datasets = list_datasets()
for ds in datasets:
    if ds["is_virtual"]:
        print(f"Found virtual dataset: {ds['name']} (ID: {ds['id']})")
        print("Getting dataset info...")
        try:
            info = get_dataset(ds['id'])
            print(f"Columns: {info['columns']}")
        except Exception as e:
            print(f"Error: {e}")
