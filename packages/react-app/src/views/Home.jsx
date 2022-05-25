import React, { useCallback } from "react";
import { Button } from "antd";
import axios from "axios";

const eip712domain = {
  name: "Scaffold-eth EIP-712",
  version: "1.0.0",
};

const serverUrl = "http://localhost:49832";

const sendSignatureToServer = async (value, signature) => {
  try {
    await axios.post(`${serverUrl}/receive-message`, { value, signature });
  } catch (error) {
    console.error(error);
  }
};

function Home({ userSigner }) {
  const typedSigner = useCallback(
    async (types, value) => {
      return await userSigner._signTypedData(eip712domain, types, value);
    },
    [userSigner],
  );

  const handleClick = async () => {
    const value = {
      message: "My message to sign",
      urgent: true,
    };

    const signature = await typedSigner(
      {
        MessageData: [
          { name: "message", type: "string" },
          { name: "urgent", type: "bool" },
        ],
      },
      value,
    );

    console.log("signature", signature);
    const response = await sendSignatureToServer(value, signature);
  };

  return (
    <div>
      <div style={{ margin: 32 }}>
        <Button onClick={handleClick}>Sign!</Button>
      </div>
    </div>
  );
}

export default Home;
