const { Parser } = require('node-sql-parser');
const parser = new Parser();
const sql = 'SELECT SUM("profit") AS "TotalProfit", SUM("revenue") AS "TotalRevenue" FROM "alldatamerged" AS "AllDataMerged" LIMIT 200';
let ast;
try {
  ast = parser.astify(sql, { database: "postgresql" });
} catch(e) {
  ast = parser.astify(sql);
}
console.log(JSON.stringify(ast, null, 2));
