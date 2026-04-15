from typing import List, Dict, Any
from DataModels import PipelineRequest, PipelineStep, FilterStep, GroupByStep

class SqlGenerator:
    def __init__(self, table_name: str):
        self.TableName = table_name
        
    def Generate(self, request: PipelineRequest) -> str:
        select_clause = "SELECT *"
        from_clause = f"FROM {self.TableName}"
        where_clauses = []
        group_by_clause = ""
        
        for step in request.Steps:
            if step.StepType == "FILTER":
                filter_conf = FilterStep(**step.Config)
                val = f"'{filter_conf.Value}'" if isinstance(filter_conf.Value, str) else str(filter_conf.Value)
                where_clauses.append(f"{filter_conf.Column} {filter_conf.Operator} {val}")
                
            elif step.StepType == "GROUP_BY":
                group_conf = GroupByStep(**step.Config)
                
                select_items = list(group_conf.Columns)
                for agg in group_conf.Aggregations:
                    func = agg.Function.upper()
                    expr = f"{func}({agg.Column})"
                    if agg.Alias:
                        expr += f" AS {agg.Alias}"
                    select_items.append(expr)
                    
                select_clause = "SELECT " + ", ".join(select_items)
                group_by_clause = "GROUP BY " + ", ".join(group_conf.Columns)

        query = f"{select_clause}\n{from_clause}"
        if where_clauses:
            query += "\nWHERE " + " AND ".join(where_clauses)
        if group_by_clause:
            query += "\n" + group_by_clause
            
        return query + ";"
