const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db/log.db");

module.exports = db;
