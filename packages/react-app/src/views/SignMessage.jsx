import React, { useState } from "react";
import { Button, Checkbox, Input, notification, Space, Tooltip } from "antd";
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

const INITIAL_FORM_STATE = {
  message: "",
  urgent: false,
};

const SignMessage = ({ userSigner }) => {
  // The Form to collect the message
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  // We'll use it to try a reply attack
  const [lastFormState, setLastFormState] = useState(null);
  const typedSigner = useTypedSigner(userSigner, eip712domain);

  const handleSubmit = async (replay = false) => {
    let values;
    if (replay) {
      // Replay attack. Used stored values.
      values = lastFormState;
    } else {
      // Regular values.
      values = {
        ...formState,
        // Add the current timestamp for replay attack protection (check backend/index.js)
        timestamp: Date.now(),
      };
    }

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
    setLastFormState(values);
  };

  return (
    <div>
      <div style={{ margin: 32 }}>
        <Space direction="vertical">
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
            <Button onClick={() => handleSubmit(false)} type="primary" style={{ marginTop: 15 }}>
              Sign & Send
            </Button>
            {lastFormState && (
              <Tooltip title="We'll sign the same values and send them to the server">
                <Button onClick={() => handleSubmit(true)} type="primary" danger>
                  Attempt reply attack
                </Button>
              </Tooltip>
            )}
          </Space>
        </Space>
      </div>
    </div>
  );
};

export default SignMessage;
