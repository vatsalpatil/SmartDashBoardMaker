import polars as pl
from typing import Any, List
from DataModels import PipelineRequest, PipelineStep, FilterStep, GroupByStep, AggregateStep

class DataProcessor:
    def __init__(self, data_path: str):
        self.Lf = pl.scan_csv(data_path)

    def ApplyFilter(self, step_config: FilterStep) -> None:
        col = step_config.Column
        op = step_config.Operator
        val = step_config.Value
        
        if op == "=":
            self.Lf = self.Lf.filter(pl.col(col) == val)
        elif op == ">":
            self.Lf = self.Lf.filter(pl.col(col) > val)
        elif op == "<":
            self.Lf = self.Lf.filter(pl.col(col) < val)
        elif op == ">=":
            self.Lf = self.Lf.filter(pl.col(col) >= val)
        elif op == "<=":
            self.Lf = self.Lf.filter(pl.col(col) <= val)
        
    def ApplyGroupBy(self, step_config: GroupByStep) -> None:
        group_cols = step_config.Columns
        agg_exprs = []
        for agg in step_config.Aggregations:
            func = agg.Function.upper()
            expr = None
            if func == "SUM":
                expr = pl.col(agg.Column).sum()
            elif func == "AVG":
                expr = pl.col(agg.Column).mean()
            elif func == "MIN":
                expr = pl.col(agg.Column).min()
            elif func == "MAX":
                expr = pl.col(agg.Column).max()
            elif func == "COUNT":
                expr = pl.col(agg.Column).count()
                
            if expr is not None:
                if agg.Alias:
                    expr = expr.alias(agg.Alias)
                agg_exprs.append(expr)
                
        if len(agg_exprs) > 0:
            self.Lf = self.Lf.group_by(group_cols).agg(agg_exprs)

    def ProcessPipeline(self, request: PipelineRequest) -> pl.DataFrame:
        for step in request.Steps:
            if step.StepType == "FILTER":
                self.ApplyFilter(FilterStep(**step.Config))
            elif step.StepType == "GROUP_BY":
                self.ApplyGroupBy(GroupByStep(**step.Config))
                
        return self.Lf.collect()
