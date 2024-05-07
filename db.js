const mysql = require("mysql2/promise");

const mySqlPool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Aman@172003",
  database: "bookcamp",
});

module.exports = mySqlPool;
