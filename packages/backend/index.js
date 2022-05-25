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

// Two different DApps might use identical types & values.
// To prevent a signature being valid in multiple DApps,
// EIP721 introduces the «domain separator».
// Read more: https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
const EIP712_DOMAIN = {
  name: "Scaffold-eth EIP-712",
  version: "1.0.0",
};

/**
 * Returns the address that signed the EIP-712 value for the domain
 * and types to produce the signature.
 *
 * @param {Object} types - The struct with the fields and its types
 * @param {Object} values - The fields values
 * @param {string} signature - The signature which signed the data
 * @returns {string} the recovered address of the signer
 */
const recoverSignerAddress = (types, values, signature) => {
  return ethers.utils.verifyTypedData(EIP712_DOMAIN, types, values, signature);
};

/**
 * Get the EIP712 types for a given action.
 *
 * @param {string} action
 * @returns {Object}
 */
const getTypesForAction = action => {
  switch (action) {
    case "new-message":
      return {
        MessageData: [
          { name: "message", type: "string" },
          { name: "urgent", type: "bool" },
        ],
      };
    default:
      return {};
  }
};

// Save a new message
app.post("/new-message", async (req, res) => {
  const { values, signature } = req.body;
  console.log("new-message", values, signature);

  const types = getTypesForAction("new-message");
  const signerAddress = recoverSignerAddress(types, values, signature);

  console.log("signerAddress", signerAddress);

  res.status(200).send("Message saved successfully");
});

const PORT = process.env.PORT || 49832;

const server = app.listen(PORT, () => {
  console.log("HTTP Listening on port:", server.address().port);
});
