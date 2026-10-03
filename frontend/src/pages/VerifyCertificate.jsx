import { useState } from "react";
import { useSearchParams } from "react-router-dom";

function VerifyCertificate() {
  const [searchParams] = useSearchParams();

  const qrCertificateId = searchParams.get("id");

  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [certificateId, setCertificateId] = useState(
    qrCertificateId || ""
  );

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateHash = async (selectedFile) => {
    setLoading(true);
    setResult(null);
    setHash("");

    try {
      const arrayBuffer =
        await selectedFile.arrayBuffer();

      const hashBuffer =
        await crypto.subtle.digest(
          "SHA-256",
          arrayBuffer
        );

      const hashArray = Array.from(
        new Uint8Array(hashBuffer)
      );

      const hashHex = hashArray
        .map((byte) =>
          byte.toString(16).padStart(2, "0")
        )
        .join("");

      setHash(hashHex);
    } catch (error) {
      console.error(error);

      setResult({
        error: "Could not process the PDF file."
      });
    }

    setLoading(false);
  };

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);

    calculateHash(selectedFile);
  };

  const verifyCertificate = async () => {
    if (!certificateId || !hash) {
      alert(
        "Please enter Certificate ID and upload the certificate."
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `http://localhost:5050/api/certificate/${certificateId}?hash=${hash}`
      );

      const data = await response.json();

      setResult(data);

    } catch (error) {
      console.error(error);

      setResult({
        error:
          "Unable to connect to CertiChain backend."
      });
    }

    setLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === "0") {
      return "Unknown";
    }

    return new Date(
      Number(timestamp) * 1000
    ).toLocaleString();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "50px 8%",
        background: "#f7f7fb"
      }}
    >
      <p
        style={{
          color: "#635bff",
          fontWeight: "600",
          letterSpacing: "1px"
        }}
      >
        CERTICHAIN
      </p>

      <h1 style={{ marginTop: "8px" }}>
        Verify Academic Certificate
      </h1>

      <p
        style={{
          marginTop: "10px",
          color: "#666"
        }}
      >
        Verify certificate authenticity using
        blockchain technology.
      </p>

      <div
        style={{
          marginTop: "35px",
          background: "white",
          padding: "35px",
          borderRadius: "14px",
          maxWidth: "800px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.06)"
        }}
      >
        <h2>Certificate ID</h2>

        <input
          type="text"
          placeholder="Example: CERT-100"
          value={certificateId}
          onChange={(event) =>
            setCertificateId(event.target.value)
          }
          style={{
            width: "100%",
            padding: "13px",
            marginTop: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
            fontSize: "15px"
          }}
        />

        <h2 style={{ marginTop: "30px" }}>
          Upload Certificate
        </h2>

        <p
          style={{
            marginTop: "8px",
            color: "#777"
          }}
        >
          Upload the original PDF certificate to
          calculate its SHA-256 fingerprint.
        </p>

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ marginTop: "15px" }}
        />

        {file && (
          <p style={{ marginTop: "15px" }}>
            <strong>Selected:</strong>{" "}
            {file.name}
          </p>
        )}

        {loading && (
          <p style={{ marginTop: "20px" }}>
            Processing...
          </p>
        )}

        {hash && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#f4f4f8",
              borderRadius: "8px",
              wordBreak: "break-all"
            }}
          >
            <strong>
              SHA-256 Certificate Hash
            </strong>

            <p
              style={{
                marginTop: "8px",
                fontFamily: "monospace",
                fontSize: "13px"
              }}
            >
              {hash}
            </p>
          </div>
        )}

        <button
          onClick={verifyCertificate}
          disabled={loading}
          style={{
            marginTop: "25px",
            padding: "14px 25px",
            border: "none",
            borderRadius: "8px",
            background: "#635bff",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600"
          }}
        >
          {loading
            ? "Verifying..."
            : "Verify on Blockchain"}
        </button>

        {result && (
          <div
            style={{
              marginTop: "30px",
              padding: "25px",
              borderRadius: "12px",
              background: result.error
                ? "#fff0f0"
                : result.revoked
                ? "#fff4e5"
                : result.valid
                ? "#e8f7ee"
                : "#fff0f0"
            }}
          >
            {result.error ? (
              <p>
                <strong>Error:</strong>{" "}
                {result.error}
              </p>
            ) : (
              <>
                <h2>
                  {result.revoked
                    ? "⚠️ Certificate Revoked"
                    : result.valid
                    ? "✅ Certificate Authentic"
                    : "❌ Certificate Invalid"}
                </h2>

                {result.valid && (
                  <div
                    style={{
                      marginTop: "25px",
                      display: "grid",
                      gap: "12px"
                    }}
                  >
                    <p>
                      <strong>
                        Certificate ID:
                      </strong>{" "}
                      {result.certificateId}
                    </p>

                    <p>
                      <strong>
                        Student Name:
                      </strong>{" "}
                      {result.studentName}
                    </p>

                    <p>
                      <strong>
                        Degree:
                      </strong>{" "}
                      {result.degree}
                    </p>

                    <p>
                      <strong>
                        Department:
                      </strong>{" "}
                      {result.department}
                    </p>

                    <p>
                      <strong>
                        University:
                      </strong>{" "}
                      {result.university}
                    </p>

                    <p>
                      <strong>
                        Issuer:
                      </strong>{" "}
                      {result.issuer}
                    </p>

                    <p>
                      <strong>
                        Issue Date:
                      </strong>{" "}
                      {formatDate(
                        result.issueDate
                      )}
                    </p>

                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {result.revoked
                        ? "Revoked"
                        : "Active"}
                    </p>
                  </div>
                )}

                {!result.valid &&
                  !result.revoked && (
                    <p
                      style={{
                        marginTop: "15px"
                      }}
                    >
                      The certificate ID exists, but
                      the uploaded document does not
                      match the blockchain hash.
                    </p>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyCertificate;
