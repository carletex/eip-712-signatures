import React from "react";
import { Button, notification } from "antd";
import axios from "axios";
import useTypedSigner from "../hooks/useTypedSigner";

const serverUrl = "http://localhost:49832";
// Send New Message Request to server.
const sendNewMessageRequest = async ({ values, signature }) => {
  try {
    const response = await axios.post(`${serverUrl}/new-message`, { values, signature });
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data);
  }
};

// Two different DApps might use identical types & values.
// To prevent a signature being valid in multiple DApps,
// EIP721 introduces the «domain separator».
// Read more: https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
const eip712domain = {
  name: "Scaffold-eth EIP-712",
  version: "1.0.0",
};

// Type definitions for Message
const messageTypes = {
  MessageData: [
    { name: "message", type: "string" },
    { name: "urgent", type: "bool" },
  ],
};

const SignMessage = ({ userSigner }) => {
  const typedSigner = useTypedSigner(userSigner, eip712domain);

  const handleClick = async () => {
    const values = {
      message: "My message to sign",
      urgent: true,
    };

    // 1. Sign the values to get the signature.
    let signature;
    try {
      signature = await typedSigner(messageTypes, values);
    } catch (e) {
      notification.error({
        message: "Can't get signature",
        description: `Error: ${e.message}`,
      });
      return;
    }
    console.log("signature", signature);

    // 2. Make request to the server.
    let response;
    try {
      response = await sendNewMessageRequest({ values, signature });
    } catch (e) {
      notification.error({
        message: "Request error",
        description: `Error: ${e.message}`,
      });
    }

    notification.success({
      message: "Success",
      description: response,
    });
  };

  return (
    <div>
      <div style={{ margin: 32 }}>
        <Button onClick={handleClick}>Sign!</Button>
      </div>
    </div>
  );
};

export default SignMessage;
