export function buildSQL(config, datasetInfo, querySql = null) {
  if (!config || (!datasetInfo && !querySql)) return '';

  // 1. Resolve Data Source
  let baseSource = "";
  if (querySql) {
    baseSource = `(${querySql.trim().replace(/;$/, "")}) AS q_base`;
  } else if (typeof datasetInfo === 'string') {
    baseSource = datasetInfo.includes(' ') ? datasetInfo : `"${datasetInfo}"`;
  } else if (datasetInfo?.table_name) {
    baseSource = `"${datasetInfo.table_name}"`;
  } else if (datasetInfo?.name) {
    baseSource = `"${datasetInfo.name}"`;
  } else {
    return '';
  }

  // 2. Resolve Visualization Parameters
  const isTable = config.view_mode === 'table';
  const xField = config.x_field || (config.x_fields?.length > 0 ? config.x_fields[0] : null);
  
  const dimsArr = isTable ? (config.visible_x_fields || config.x_fields || [xField]) : [xField];
  const dimensions = [...new Set(dimsArr)].filter(Boolean);
  
  const metricsArr = (config.y_fields?.length > 0) ? config.y_fields : (config.y_field ? [config.y_field] : []);
  const metrics = [...new Set(metricsArr)].filter(Boolean);

  let isAggregated = false;
  const selectCols = [];
  const processedKeys = new Set();
  const groupByCols = [];

  // 3. Process Columns (Metrics First for Aggregation Detection)
  const colMappings = new Map(); // key -> sql

  metrics.forEach(f => {
    const agg = (config.field_aggregations || {})[f] || config.aggregation || 'none';
    const safeCol = f.includes('"') ? f : `"${f.replace(/"/g, '""')}"`;
    const alias = `"${f.replace(/"/g, '""')}"`;

    if (agg && agg !== 'none') {
      isAggregated = true;
      colMappings.set(f.toLowerCase(), `${agg.toUpperCase()}(${safeCol}) AS ${alias}`);
    } else {
      colMappings.set(f.toLowerCase(), safeCol);
    }
  });

  dimensions.forEach(f => {
    const key = f.toLowerCase();
    if (!colMappings.has(key)) {
      colMappings.set(key, `"${f.replace(/"/g, '""')}"`);
    }
  });

  // Assemble SELECT in order of appearance (Dims then Metrics)
  const finalColsOrder = [...new Set([...dimensions, ...metrics])];
  finalColsOrder.forEach(f => {
    const key = f.toLowerCase();
    if (processedKeys.has(key)) return;
    const sqlPart = colMappings.get(key);
    if (sqlPart) {
      selectCols.push(sqlPart);
      processedKeys.add(key);
    }
  });

  if (selectCols.length === 0) selectCols.push('*');

  // 4. Build Filter Set
  const filterList = [...(config.filters || [])];
  if (config.x_axis_filters?.length > 0 && xField) {
    filterList.push({ column: xField, operator: 'IN', value: config.x_axis_filters });
  }

  // 5. Construct Final Clauses
  let sql = `SELECT ${selectCols.join(', ')} FROM ${baseSource}`;

  if (filterList.length > 0) {
    const conditions = filterList.map(f => {
      if (!f.column) return null;
      const col = `"${f.column}"`;
      const op = f.operator || f.op || '=';
      const val = f.value;

      const opMapper = {
        '=': '=', '!=': '!=', '>': '>', '<': '<', '>=': '>=', '<=': '<=',
        'contains': 'ILIKE', 'startsWith': 'ILIKE', 'endsWith': 'ILIKE', 'not_contains': 'NOT ILIKE'
      };

      const sqlOp = opMapper[op] || (op === 'IN' ? 'IN' : '=');
      
      if (sqlOp === 'IN') {
        const vals = Array.isArray(val) ? val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ') : `'${String(val).replace(/'/g, "''")}'`;
        return vals ? `${col} IN (${vals})` : null;
      }

      let finalVal = val;
      if (sqlOp.includes('LIKE')) {
        const prefix = (op === 'startsWith') ? '' : '%';
        const suffix = (op === 'endsWith') ? '' : '%';
        finalVal = `'${prefix}${String(val).replace(/'/g, "''")}${suffix}'`;
      } else if (typeof finalVal === 'string') {
        finalVal = `'${finalVal.replace(/'/g, "''")}'`;
      }

      return (finalVal !== undefined && finalVal !== null) ? `${col} ${sqlOp} ${finalVal}` : null;
    }).filter(Boolean);

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  const sortRules = (config.sort_rules || []).filter(r => r.column);

  if (isAggregated) {
    const finalGroups = new Set();
    
    // 1. Add Explicit Dimensions
    dimensions.forEach(f => finalGroups.add(`"${f.replace(/"/g, '""')}"`));
    
    // 2. Add Non-Aggregated Metrics
    metrics.forEach(f => {
      const agg = (config.field_aggregations || {})[f] || config.aggregation || 'none';
      if (agg === 'none' || !agg) {
        finalGroups.add(`"${f.replace(/"/g, '""')}"`);
      }
    });

    // 3. Safety: ensure any column we sort by is also in the GROUP BY if it's not a metric alias
    sortRules.forEach(r => {
      const key = r.column.toLowerCase();
      // If it's not a metric (or it's a non-aggregated metric/dim), it must be in GROUP BY
      if (!processedKeys.has(key)) {
        finalGroups.add(`"${r.column.replace(/"/g, '""')}"`);
      }
    });

    if (finalGroups.size > 0) {
      sql += ` GROUP BY ${Array.from(finalGroups).join(', ')}`;
    }
  }


  if (sortRules.length > 0) {
    const rules = sortRules.map(r => `"${r.column.replace(/"/g, '""')}" ${r.direction || 'DESC'}`);
    sql += ` ORDER BY ${rules.join(', ')}`;
  } else if (config.sort_by) {
    sql += ` ORDER BY "${config.sort_by.replace(/"/g, '""')}" ${config.sort_dir || 'DESC'}`;
  }

  sql += ` LIMIT ${config.limit || 5000}`;

  return sql;
}
