import { useState } from "react";

const formatFieldValue = (value) => value || "—";

function FraudDetection() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile || null);
    setError("");
    setResult(null);
  };

  const analyzeCertificate = async () => {
    if (!file) {
      setError("Please upload a PDF certificate first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("http://localhost:5050/api/fraud/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (analysisError) {
      console.error(analysisError);
      setError(analysisError.message || "Unable to analyze the certificate.");
    } finally {
      setLoading(false);
    }
  };

  const riskTone = result?.riskLevel || "";

  return (
    <div className="fraud-page-shell">
      <header className="fraud-topbar">
        <div className="fraud-brand">
          <span className="brand-mark">C</span>
          <span>CertiChain</span>
        </div>

        <nav className="fraud-nav">
          <a href="/">Home</a>
          <a href="/student">Verify Certificate</a>
          <a href="/dashboard">Issuer Login/Dashboard</a>
        </nav>
      </header>

      <main className="fraud-main">
        <section className="fraud-hero">
          <p className="fraud-kicker">AI-Assisted Fraud Detection</p>
          <h1>AI Certificate Fraud Detection</h1>
          <p className="fraud-subtitle">
            Analyze an academic certificate for suspicious content and compare its information with blockchain records.
          </p>
        </section>

        <section className="fraud-upload-panel">
          <div className="fraud-upload-box">
            <label htmlFor="pdfUpload" className="upload-label">
              Upload academic certificate PDF
            </label>
            <input id="pdfUpload" type="file" accept="application/pdf" onChange={handleFileChange} />
            {file && <p className="selected-file">Selected file: {file.name}</p>}
          </div>

          <button type="button" className="primary-btn fraud-action" onClick={analyzeCertificate} disabled={loading}>
            {loading ? "Analyzing certificate..." : "Analyze Certificate"}
          </button>
        </section>

        {error && <div className="fraud-error">{error}</div>}

        {loading && (
          <div className="fraud-loading">
            <div className="spinner" aria-label="Analyzing certificate" />
            <p>Extracting text, checking blockchain records, and evaluating risk factors...</p>
          </div>
        )}

        {result && (
          <section className="fraud-results">
            <div className="fraud-summary">
              <div>
                <p className="fraud-kicker">Certificate Analysis</p>
                <h2>{result.certificateId || "Certificate Analysis"}</h2>
              </div>

              <span className={`risk-badge ${riskTone.toLowerCase().replace(/\s+/g, "-")}`}>
                {result.riskLevel}
              </span>
            </div>

            <div className="result-grid">
              <div className="result-card">
                <h3>Document Details</h3>
                <ul>
                  <li><span>Certificate ID</span><strong>{formatFieldValue(result.certificateId)}</strong></li>
                  <li><span>Student Name</span><strong>{formatFieldValue(result.extractedData?.studentName)}</strong></li>
                  <li><span>Degree</span><strong>{formatFieldValue(result.extractedData?.degree)}</strong></li>
                  <li><span>Department</span><strong>{formatFieldValue(result.extractedData?.department)}</strong></li>
                  <li><span>University</span><strong>{formatFieldValue(result.extractedData?.university)}</strong></li>
                  <li><span>Issuer</span><strong>{formatFieldValue(result.extractedData?.issuer)}</strong></li>
                </ul>
              </div>

              <div className="result-card">
                <h3>Blockchain Status</h3>
                <ul>
                  <li><span>Status</span><strong>{result.blockchainFound ? "Found" : "Not Found"}</strong></li>
                  <li><span>Document Hash</span><strong>{result.hash || "—"}</strong></li>
                  <li><span>Hash Match</span><strong>{result.hashMatch ? "MATCH" : "MISMATCH"}</strong></li>
                  <li><span>Risk Score</span><strong>{result.riskScore}/100</strong></li>
                  <li><span>Overall Risk</span><strong>{result.riskLevel}</strong></li>
                </ul>
              </div>
            </div>

            <div className="comparison-table-wrap">
              <h3>Field Comparison</h3>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Document</th>
                    <th>Blockchain</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.fieldComparison || {}).map(([field, value]) => (
                    <tr key={field}>
                      <td>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                      <td>{formatFieldValue(value.documentValue)}</td>
                      <td>{formatFieldValue(value.blockchainValue)}</td>
                      <td>{value.match ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="fraud-reasons">
              <h3>Risk Assessment</h3>
              <p>{result.reasons?.[0] || "No automatic explanation available."}</p>
              <ul>
                {result.reasons?.map((reason, index) => (
                  <li key={`${reason}-${index}`}>{reason}</li>
                ))}
              </ul>
            </div>

            {result.aiAnalysis && (
              <div className="fraud-ai-panel">
                <div className="fraud-ai-header">
                  <div>
                    <p className="fraud-kicker">AI assessment</p>
                    <h3>{result.aiAnalysis.status === "Available" ? "AI-assisted review" : "AI status"}</h3>
                  </div>
                  <span className={`ai-status-badge ${result.aiAnalysis.status === "Available" ? "ai-available" : "ai-unavailable"}`}>
                    {result.aiAnalysis.status}
                  </span>
                </div>

                <p className="ai-summary">{result.aiAnalysis.summary}</p>

                <div className="ai-meta-row">
                  <span>Provider</span>
                  <strong>{result.aiAnalysis.provider}</strong>
                </div>
                <div className="ai-meta-row">
                  <span>Model</span>
                  <strong>{result.aiAnalysis.model}</strong>
                </div>
                <div className="ai-meta-row">
                  <span>Confidence</span>
                  <strong>{result.aiAnalysis.confidence}</strong>
                </div>

                <div className="ai-findings">
                  <h4>AI Findings</h4>
                  <ul>
                    {result.aiAnalysis.findings?.map((finding, index) => (
                      <li key={`${finding}-${index}`}>{finding}</li>
                    ))}
                  </ul>
                </div>

                <div className="ai-recommendation">
                  <h4>Recommendation</h4>
                  <p>{result.aiAnalysis.recommendation}</p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default FraudDetection;
