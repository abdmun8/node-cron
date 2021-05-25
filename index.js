const cron = require("node-cron");
const express = require("express");
const db = require("./db");
const fetch = require("node-fetch");
const AbortController = require("abort-controller");
const exphbs = require("express-handlebars");
const app = express();
require("dotenv").config();

const url = process.env.TEST_URL;

app.engine(
  "hbs",
  exphbs({
    defaultLayout: "main",
    extname: ".hbs",
  })
);

app.get("/", function (req, res) {
  const qs = req.query;
  let page = 1;
  let offset = 0;
  const show = 10;

  if (qs.page) {
    const num = parseInt(qs.page, 10);
    if (!isNaN(num)) page = num;
    offset = (page - 1) * show;
  }
  const sql = `SELECT * FROM log order by time DESC LIMIT ${show} OFFSET ${offset}`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    db.get("SELECT COUNT(time) as total FROM log", [], (err, row) => {
      if (err) {
        throw err;
      }
      const data = rows.map((row) => ({
        ...row,
        time: new Date(row.time).toLocaleString(),
      }));

      const totalPage = Math.ceil(row.total / show);

      res.render("logTable.hbs", {
        data,
        total: totalPage,
        url,
        pagination: {
          current: page,
          next: page + 1 > totalPage ? "#" : `?page=${page + 1}`,
          prev: page - 1 === 0 ? "#" : `?page=${page - 1}`,
          first: `?page=${1}`,
          last: `?page=${totalPage}`,
        },
      });
    });
  });
});

const controller = new AbortController();
const timeout = setTimeout(() => {
  controller.abort();
}, 30000);

cron.schedule(process.env.INTERVAL, () => {
  fetch(url, { signal: controller.signal })
    .then((resp) => resp.json())
    .then(
      (data) => {
        const time = new Date().getTime();
        db.run(`INSERT INTO log(time,message) values (${time},'Success')`);
      },
      (err) => {
        if (err.name === "AbortError") {
          const time = new Date().getTime();
          db.run(
            `INSERT INTO log(time,message) values (${time},'timeout after 30s'`
          );
        }
      }
    )
    .catch((err) => {
      const time = new Date().getTime();
      db.run(
        `INSERT INTO log(time,message) values (${time},'${JSON.stringify(err)}'`
      );
    })
    .finally(() => {
      clearTimeout(timeout);
    });
});

app.listen(process.env.PORT);
