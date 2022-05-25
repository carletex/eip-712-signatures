const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const bodyParser = require("body-parser");
const JSONdb = require("simple-json-db");

const db = new JSONdb("./local_database/db.json");
const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const EIP712_DOMAIN = {
  name: "Scaffold-eth EIP-712",
  version: "1.0.0",
};

/**
 * Recovers the signer address.
 */
const recoverSignerAddress = (types, values, signature) => {
  return ethers.utils.verifyTypedData(EIP712_DOMAIN, types, values, signature);
};

app.post("/receive-message", async (req, res) => {
  const { value, signature } = req.body;
  console.log("receive-message", value, signature);

  const types = {
    MessageData: [
      { name: "message", type: "string" },
      { name: "urgent", type: "bool" },
    ],
  };

  const signerAddress = recoverSignerAddress(types, value, signature);
  console.log("signerAddress", signerAddress);

  res.sendStatus(200);
});

const PORT = process.env.PORT || 49832;

const server = app.listen(PORT, () => {
  console.log("HTTP Listening on port:", server.address().port);
});
