const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

try {
  const fileExist = fs.readFileSync("./db/log.db");
  console.log("db exist");
} catch (error) {
  fs.writeFileSync("./db/log.db", "");
  console.log("db created");
}

let db = new sqlite3.Database("./db/log.db", (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log("Connected to the log database.");
});

db.run(`CREATE TABLE log(
  time INTEGER,
  message TEXT
  )`);
