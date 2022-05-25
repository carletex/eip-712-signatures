const JSONdb = require("simple-json-db");
const db = new JSONdb("./local_database/db.json");

const getUserByAddress = address => {
  return db.get(address);
};

const createUser = (address, messageData) => {
  const lastTimestamp = messageData.timestamp;
  const messages = [messageData];
  db.set(address, { lastTimestamp, messages });
};

const updateUser = (address, messageData) => {
  const user = getUserByAddress(address);
  const lastTimestamp = messageData.timestamp;
  user.messages.push(messageData);
  db.set(address, { lastTimestamp, messages: user.messages });
};

module.exports = {
  getUserByAddress,
  createUser,
  updateUser,
};
