const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const JSONdb = require("simple-json-db");

const db = new JSONdb("./local_database/db.json");
const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/receive-signature", async (req, res) => {
  const { value, signature } = req.body;
  console.log("receive-signature", value, signature);

  res.sendStatus(200);
});

const PORT = process.env.PORT || 49832;

const server = app.listen(PORT, () => {
  console.log("HTTP Listening on port:", server.address().port);
});
