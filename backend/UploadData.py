from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import shutil
import os
from DataModels import PipelineRequest
from DataProcessor import DataProcessor
from SqlGenerator import SqlGenerator
import json

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def UploadDataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "File uploaded successfully", "DatasetId": file.filename, "Path": file_path}

@router.post("/pipeline")
async def RunPipeline(request: PipelineRequest):
    # Retrieve file path
    file_path = os.path.join(UPLOAD_DIR, request.DatasetId)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    processor = DataProcessor(file_path)
    try:
        result_df = processor.ProcessPipeline(request)
        # Convert to records
        data = result_df.to_dicts()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    sql_gen = SqlGenerator(table_name=request.DatasetId.split('.')[0])
    sql_query = sql_gen.Generate(request)
    
    return {
        "Data": data,
        "Sql": sql_query
    }
