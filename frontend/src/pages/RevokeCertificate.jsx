import { useState } from "react";

function RevokeCertificate() {
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const revokeCertificate = async () => {
    if (!certificateId) {
      alert("Please enter Certificate ID.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:5050/api/certificate/revoke",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            certificateId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Revocation failed"
        );
      }

      setResult(data);
    } catch (error) {
      setResult({
        error: error.message,
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "60px 8%" }}>
      <h1>Revoke Certificate</h1>

      <p style={{ marginTop: "15px", color: "#666" }}>
        Permanently mark an issued certificate as revoked
        on the blockchain.
      </p>

      <div
        style={{
          marginTop: "40px",
          padding: "40px",
          border: "2px solid #e05252",
          borderRadius: "12px",
          maxWidth: "600px",
        }}
      >
        <h2>Certificate ID</h2>

        <input
          type="text"
          placeholder="Example: CERT-004"
          value={certificateId}
          onChange={(e) =>
            setCertificateId(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={revokeCertificate}
          disabled={loading}
          style={{
            marginTop: "25px",
            padding: "13px 25px",
            border: "none",
            borderRadius: "8px",
            background: "#e05252",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {loading
            ? "Revoking..."
            : "Revoke Certificate"}
        </button>

        {result && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              borderRadius: "8px",
              background: result.success
                ? "#fff4e5"
                : "#fff0f0",
            }}
          >
            {result.success ? (
              <>
                <h2>⚠️ Certificate Revoked</h2>

                <p>
                  The certificate has been marked as
                  revoked on the blockchain.
                </p>

                <p
                  style={{
                    wordBreak: "break-all",
                    marginTop: "10px",
                  }}
                >
                  <strong>Transaction:</strong>{" "}
                  {result.transactionHash}
                </p>
              </>
            ) : (
              <p>
                <strong>Error:</strong>{" "}
                {result.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RevokeCertificate;
