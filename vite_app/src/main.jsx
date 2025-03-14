import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { UserManager, OidcClient } from "oidc-client";
import FetchAndVisualize from "./FetchAndVisualize";

// User Manager for OIDC Authentication
const userManager = new UserManager({
  authority: "https://app.meldrx.com/",
  client_id: "8a9c3cd033de49f2998a74369df478e3",
  response_type: "code",
  redirect_uri: "http://localhost:4434/callback",
});

function App() {
  const [patientId, setPatientId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // Handle OIDC authentication
  useEffect(() => {
    if (window.location.pathname === "/launch") {
      console.log("launch", window.location);
      const extraQueryParams = {};
      const params = window.location.search
        .split("?")[1]
        .split("&")
        .map((x) => x.split("="));

      for (const kv of params) {
        extraQueryParams[kv[0] === "iss" ? "aud" : kv[0]] = kv[1];
      }
      console.log(extraQueryParams);

      userManager.signinRedirect({
        scope: "openid profile patient/*.* launch",
        extraQueryParams,
      });
    } else if (window.location.pathname === "/callback") {
      console.log("callback", window.location);
      var oidc = new OidcClient({
        authority: "https://app.meldrx.com/",
        client_id: "8a9c3cd033de49f2998a74369df478e3",
        response_type: "code",
        redirect_uri: "http://localhost:4434/callback",
      });

      oidc.processSigninResponse(window.location.href).then((result) => {
        console.log("Patient ID:", result.patient);
        setPatientId(result.patient);
      });
    }
  }, []);

  // WebSocket connection for chat messages
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8001/ws/chat/");

    socket.onopen = () => console.log("Connected to WebSocket");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("AI Response:", data.message);
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: data.message },
      ]);
    };

    return () => socket.close();
  }, []);

  const sendMessage = (message) => {
    setChatMessages((prev) => [...prev, { sender: "User", text: message }]);
    const socket = new WebSocket("ws://localhost:8001/ws/chat/");
    socket.onopen = () => socket.send(JSON.stringify({ message }));
  };

  return (
    <div
      style={{ display: "flex", height: "100vh", padding: "20px", gap: "20px" }}
    >
      {/* Left Column: Data Visualization */}
      <div
        style={{ flex: 2, borderRight: "1px solid #ccc", paddingRight: "20px" }}
      >
        <h1>Patient Health Data Visualization</h1>
        {patientId ? (
          <FetchAndVisualize patientId={patientId} />
        ) : (
          <p>Loading patient data...</p>
        )}
      </div>

      {/* Middle Column: Cardiovascular Risk Report */}
      <div style={{ flex: 1, borderRight: "1px solid #ccc", padding: "20px" }}>
        <h2>Cardiovascular Risk Report</h2>
        {reportData ? (
          <CvdRiskReport data={reportData} />
        ) : (
          <p>Loading Report...</p>
        )}
      </div>

      {/* Right Column: Chat Box */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>AI Medical Assistant</h2>
        <ChatBox messages={chatMessages} onSendMessage={sendMessage} />
      </div>
    </div>
  );
}

// Component to Display Cardiovascular Risk Report
function CvdRiskReport({ data }) {
  return (
    <div id="cvd-report">
      <h3>
        Overall Risk Estimate: {data["Overall Risk Estimate"] || "Unknown"}
      </h3>
      <h4>Risk Factors:</h4>
      <ul>
        {data["Risk Factor Assessment"] ? (
          generateNestedList(data["Risk Factor Assessment"])
        ) : (
          <li>No risk factors available.</li>
        )}
      </ul>
      <h4>Recommendations:</h4>
      <ul>
        {data.Recommendations ? (
          generateNestedList(data.Recommendations)
        ) : (
          <li>No recommendations available.</li>
        )}
      </ul>
    </div>
  );
}

// Component to Handle Chat Box
function ChatBox({ messages, onSendMessage }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() !== "") {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div>
      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === "User" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Type a message..."
        style={{ width: "80%", padding: "5px", marginTop: "10px" }}
      />
      <button
        onClick={handleSend}
        style={{ marginLeft: "10px", padding: "5px 10px" }}
      >
        Send
      </button>
    </div>
  );
}

// Helper function to generate a nested list for the risk report
function generateNestedList(obj) {
  return Object.entries(obj).map(([key, value]) =>
    typeof value === "object" ? (
      <li key={key}>
        <strong>{key}:</strong>
        <ul>{generateNestedList(value)}</ul>
      </li>
    ) : (
      <li key={key}>
        <strong>{key}:</strong> {value}
      </li>
    )
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
