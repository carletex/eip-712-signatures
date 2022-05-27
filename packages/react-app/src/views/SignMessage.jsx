import React, { useState } from "react";
import { Button, Checkbox, Input, notification, Space, Tooltip } from "antd";
import axios from "axios";
import useTypedSigner from "../hooks/useTypedSigner";
import Text from "antd/es/typography/Text";
import { Link } from "react-router-dom";

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
  // --- Other fields
  // chainId
  // verifyingContract
};

const INITIAL_FORM_STATE = {
  message: "",
  urgent: false,
};

const SignMessage = ({ userSigner }) => {
  // The Form to collect the message
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  // We'll use it to try a reply attack
  const [lastPayload, setLastPayload] = useState(null);
  const typedSigner = useTypedSigner(userSigner, eip712domain);

  // Sign the message and send it to the server.
  const signAndSendMessage = async () => {
    let values = {
      ...formState,
      // Add the current timestamp for replay attack protection (check backend/index.js)
      timestamp: Date.now(),
    };

    // 1. Sign the values to get the signature.
    let signature;
    try {
      // Type definitions for Message
      const messageTypes = {
        MessageData: [
          { name: "message", type: "string" },
          { name: "urgent", type: "bool" },
          { name: "timestamp", type: "uint256" },
        ],
      };

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
      return;
    }

    notification.success({
      message: "Success",
      description: response,
    });
    setFormState(INITIAL_FORM_STATE);
    setLastPayload({ values, signature });
  };

  // Send to the server the previous payload
  const sendReplayAttack = async () => {
    let response;
    try {
      response = await sendNewMessageRequest({
        values: lastPayload.values,
        signature: lastPayload.signature,
      });
    } catch (e) {
      notification.error({
        message: "Request error",
        description: `Error: ${e.message}`,
      });
      return;
    }

    notification.success({
      message: "Success",
      description: response,
    });
  };

  return (
    <Space direction="vertical" style={{ margin: 32 }} size="middle">
      <Space direction="vertical" size="middle">
        <Text>
          Craft a message & sign it using the{" "}
          <Link href="https://eips.ethereum.org/EIPS/eip-712" target="_blank">
            EIP712 standard
          </Link>
          .
        </Text>
        <Text>
          You can find the front-end code in <Text code>packages/react-app/src/views/SignMessage.jsx</Text>
        </Text>
        <Text>
          The signed message will be verified and stored by the back-end server. Check{" "}
          <Text code>packages/backend/index.js</Text>
        </Text>
        <Text>
          Once you send a valid signed message, you can attempt a <Text type="danger">replay attack</Text>.
        </Text>
      </Space>
      <div style={{ background: "#f3f3f3" }}>
        <Space direction="vertical" style={{ margin: 32 }}>
          <Input
            placeholder="Message"
            value={formState.message}
            onChange={event =>
              setFormState(prevFormState => ({
                ...prevFormState,
                message: event.target.value,
              }))
            }
            style={{ width: 450, maxWidth: "80%" }}
          />
          <Checkbox
            checked={formState.urgent}
            onChange={() =>
              setFormState(prevFormState => ({
                ...prevFormState,
                urgent: !prevFormState.urgent,
              }))
            }
          >
            Mark as urgent
          </Checkbox>
          <Space direction="vertical">
            <Button onClick={signAndSendMessage} type="primary" style={{ marginTop: 15 }}>
              Sign & Send
            </Button>
            {lastPayload && (
              <Tooltip title="We'll sign the same values and send them to the server">
                <Button onClick={sendReplayAttack} type="primary" danger>
                  Attempt reply attack
                </Button>
              </Tooltip>
            )}
          </Space>
        </Space>
      </div>
    </Space>
  );
};

export default SignMessage;
