import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

function IssueCertificate() {
  const [form, setForm] = useState({
    certificateId: "",
    studentName: "",
    studentEmail: "",
    degree: "",
    department: "",
    university: "",
    issuer: "",
  });

  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const calculateHash = async (selectedFile) => {
    setLoading(true);
    setResult(null);
    setHash("");

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      const hashBuffer = await crypto.subtle.digest(
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
        error: "Could not process the PDF file.",
      });
    }

    setLoading(false);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    calculateHash(selectedFile);
  };

  const issueCertificate = async () => {
    if (
      !form.certificateId ||
      !form.studentName ||
      !form.studentEmail ||
      !form.degree ||
      !form.department ||
      !form.university ||
      !form.issuer
    ) {
      alert("Please fill in all certificate fields.");
      return;
    }

    if (!hash) {
      alert("Please upload the certificate PDF.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:5050/api/certificate/issue",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            certificateId: form.certificateId,
            studentName: form.studentName,
            studentEmail: form.studentEmail,
            degree: form.degree,
            department: form.department,
            university: form.university,
            certificateHash: hash,
            issuer: form.issuer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Certificate issuance failed"
        );
      }

      setResult(data);
    } catch (error) {
      console.error(error);

      setResult({
        error: error.message,
      });
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "50px 8%",
        background: "#f7f7fb",
      }}
    >
      <p
        style={{
          color: "#635bff",
          fontWeight: "600",
          letterSpacing: "1px",
        }}
      >
        CERTICHAIN
      </p>

      <h1 style={{ marginTop: "8px" }}>
        Issue Academic Certificate
      </h1>

      <p
        style={{
          marginTop: "10px",
          color: "#666",
        }}
      >
        Register a complete academic certificate on the
        blockchain.
      </p>

      <div
        style={{
          marginTop: "35px",
          background: "white",
          padding: "35px",
          borderRadius: "14px",
          maxWidth: "800px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <h2>Student Information</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          <div>
            <label>Certificate ID</label>

            <input
              name="certificateId"
              value={form.certificateId}
              onChange={handleChange}
              placeholder="CERT-001"
              style={inputStyle}
            />
          </div>

          <div>
            <label>Student Name</label>

            <input
              name="studentName"
              value={form.studentName}
              onChange={handleChange}
              placeholder="Rahul Sharma"
              style={inputStyle}
            />
          </div>

          <div>
            <label>Student Email</label>

            <input
              type="email"
              name="studentEmail"
              value={form.studentEmail}
              onChange={handleChange}
              placeholder="student@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label>Degree</label>

            <input
              name="degree"
              value={form.degree}
              onChange={handleChange}
              placeholder="B.Tech Computer Science"
              style={inputStyle}
            />
          </div>

          <div>
            <label>Department</label>

            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Computer Science"
              style={inputStyle}
            />
          </div>

          <div>
            <label>University</label>

            <input
              name="university"
              value={form.university}
              onChange={handleChange}
              placeholder="ABC University"
              style={inputStyle}
            />
          </div>

          <div>
            <label>Issuer</label>

            <input
              name="issuer"
              value={form.issuer}
              onChange={handleChange}
              placeholder="ABC University"
              style={inputStyle}
            />
          </div>
        </div>

        <h2 style={{ marginTop: "35px" }}>
          Certificate PDF
        </h2>

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ marginTop: "15px" }}
        />

        {file && (
          <p style={{ marginTop: "12px" }}>
            <strong>Selected:</strong> {file.name}
          </p>
        )}

        {hash && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#f4f4f8",
              borderRadius: "8px",
              wordBreak: "break-all",
            }}
          >
            <strong>SHA-256 Certificate Hash</strong>

            <p
              style={{
                marginTop: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            >
              {hash}
            </p>
          </div>
        )}

        <button
          onClick={issueCertificate}
          disabled={loading}
          style={{
            marginTop: "30px",
            padding: "14px 28px",
            border: "none",
            borderRadius: "8px",
            background: "#635bff",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          {loading
            ? "Processing..."
            : "Issue Certificate"}
        </button>

        {result && (
          <div
            style={{
              marginTop: "30px",
              padding: "25px",
              borderRadius: "10px",
              background: result.success
                ? "#e8f7ee"
                : "#fff0f0",
            }}
          >
            {result.success ? (
              <>
                <h2>✅ Certificate Issued</h2>

                <div style={{ marginTop: "20px" }}>
                  <p>
                    <strong>Certificate ID:</strong>{" "}
                    {result.certificateId}
                  </p>

                  <p>
                    <strong>Student:</strong>{" "}
                    {result.studentName}
                  </p>

                  <p>
                    <strong>Degree:</strong>{" "}
                    {result.degree}
                  </p>

                  <p>
                    <strong>University:</strong>{" "}
                    {result.university}
                  </p>

                  <p>
                    <strong>Issuer:</strong>{" "}
                    {result.issuer}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "25px",
                    textAlign: "center",
                  }}
                >
                  <h3>Scan to Verify</h3>

                  <QRCodeCanvas
                    value={`${window.location.origin}/verify?id=${result.certificateId}`}
                    size={200}
                    style={{ marginTop: "15px" }}
                  />

                  <p
                    style={{
                      marginTop: "15px",
                      color: "#666",
                    }}
                  >
                    Scan this QR code to open the
                    certificate verification page.
                  </p>
                </div>

                <p
                  style={{
                    marginTop: "25px",
                    wordBreak: "break-all",
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

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "15px",
  boxSizing: "border-box",
};

export default IssueCertificate;
