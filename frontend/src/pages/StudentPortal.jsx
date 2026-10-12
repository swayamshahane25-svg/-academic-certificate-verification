import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const STATUS_STYLES = {
  valid: "status-badge status-valid",
  revoked: "status-badge status-revoked",
  invalid: "status-badge status-invalid",
};

function formatDate(timestamp) {
  if (!timestamp || timestamp === "0") {
    return "Unknown";
  }

  return new Date(Number(timestamp) * 1000).toLocaleString();
}

function StudentPortal() {
  const [searchParams] = useSearchParams();
  const qrCertificateId = searchParams.get("id") || "";

  const [certificateId, setCertificateId] = useState(qrCertificateId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const qrValue = useMemo(() => {
    if (!certificateId) return "";
    return `${window.location.origin}/student?id=${encodeURIComponent(certificateId)}`;
  }, [certificateId]);

  const verifyCertificate = async (idToVerify) => {
    const trimmedId = (idToVerify || "").trim();

    if (!trimmedId) {
      setResult({
        status: "invalid",
        message: "Please enter a certificate ID to verify.",
      });
      setError("Certificate ID is required.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `http://localhost:5050/api/certificate/lookup/${encodeURIComponent(trimmedId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setResult({
            status: "invalid",
            message: "Certificate could not be verified against the blockchain record.",
            certificateId: trimmedId,
            notFound: true,
          });
          return;
        }

        throw new Error(data.error || "Verification failed");
      }

      if (data.revoked) {
        setResult({
          status: "revoked",
          message: "Certificate Revoked",
          certificate: data,
          certificateId: data.certificateId || trimmedId,
        });
        return;
      }

      setResult({
        status: "valid",
        message: "Certificate Authentic",
        certificate: data,
        certificateId: data.certificateId || trimmedId,
      });
    } catch (verificationError) {
      console.error(verificationError);
      setResult({
        status: "invalid",
        message: "Certificate Not Verified",
        certificateId: trimmedId,
        backendError: true,
      });
      setError(
        verificationError.message || "Unable to connect to the CertiChain backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (qrCertificateId) {
      const timeoutId = window.setTimeout(() => {
        void verifyCertificate(qrCertificateId);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [qrCertificateId]);

  const handleCopyLink = async () => {
    if (!certificateId) {
      setError("Enter a certificate ID first.");
      return;
    }

    const link = `${window.location.origin}/student?id=${encodeURIComponent(certificateId)}`;

    try {
      await navigator.clipboard.writeText(link);
      setError("");
      setResult((current) => ({
        ...current,
        copied: true,
      }));
    } catch (copyError) {
      console.error(copyError);
      setError("Unable to copy the verification link automatically.");
    }
  };

  const handlePrint = () => {
    if (!result || result.status !== "valid") {
      setError("Verify a valid certificate before printing.");
      return;
    }

    window.print();
  };

  const renderResult = () => {
    if (loading) {
      return (
        <div className="student-result student-loading">
          <div className="spinner" aria-label="Loading verification result" />
          <p>Verifying certificate against the blockchain...</p>
        </div>
      );
    }

    if (!result) {
      return null;
    }

    if (result.status === "valid" && result.certificate) {
      const certificate = result.certificate;

      return (
        <div className="verification-stack">
          <div className="verification-alert success">
            <span className="alert-icon">✅</span>
            <div>
              <h3>{result.message}</h3>
              <p>Certificate details have been matched to the blockchain record.</p>
            </div>
          </div>

          <div className="certificate-card">
            <div className="certificate-card-header">
              <div>
                <p className="kicker">CertiChain verification</p>
                <h4>Academic Certificate</h4>
              </div>
              <span className={STATUS_STYLES.valid}>Active</span>
            </div>

            <div className="certificate-card-body">
              <div className="certificate-person">
                <span className="person-label">Student</span>
                <strong>{certificate.studentName || "—"}</strong>
              </div>

              <div className="certificate-grid">
                <div>
                  <span>Degree</span>
                  <strong>{certificate.degree || "—"}</strong>
                </div>
                <div>
                  <span>Department</span>
                  <strong>{certificate.department || "—"}</strong>
                </div>
                <div>
                  <span>University</span>
                  <strong>{certificate.university || "—"}</strong>
                </div>
                <div>
                  <span>Certificate ID</span>
                  <strong>{certificate.certificateId || result.certificateId}</strong>
                </div>
                <div>
                  <span>Issuer</span>
                  <strong>{certificate.issuer || "—"}</strong>
                </div>
                <div>
                  <span>Issue Date</span>
                  <strong>{formatDate(certificate.issueDate)}</strong>
                </div>
              </div>
            </div>

            <div className="certificate-footer">
              <span>Blockchain verified</span>
              <span className="verified-pill">Secure</span>
            </div>
          </div>
        </div>
      );
    }

    if (result.status === "revoked") {
      const certificate = result.certificate || {};

      return (
        <div className="verification-stack">
          <div className="verification-alert warn">
            <span className="alert-icon">⚠️</span>
            <div>
              <h3>{result.message}</h3>
              <p>This certificate exists on the blockchain but has been revoked.</p>
            </div>
          </div>

          <div className="verification-details">
            <div className="detail-row"><span>Certificate ID</span><strong>{certificate.certificateId || result.certificateId}</strong></div>
            <div className="detail-row"><span>Student Name</span><strong>{certificate.studentName || "—"}</strong></div>
            <div className="detail-row"><span>Degree</span><strong>{certificate.degree || "—"}</strong></div>
            <div className="detail-row"><span>Department</span><strong>{certificate.department || "—"}</strong></div>
            <div className="detail-row"><span>University</span><strong>{certificate.university || "—"}</strong></div>
            <div className="detail-row"><span>Issuer</span><strong>{certificate.issuer || "—"}</strong></div>
            <div className="detail-row"><span>Issue Date</span><strong>{formatDate(certificate.issueDate)}</strong></div>
            <div className="detail-row"><span>Status</span><strong className={STATUS_STYLES.revoked}>Revoked</strong></div>
          </div>
        </div>
      );
    }

    return (
      <div className="verification-stack">
        <div className="verification-alert danger">
          <span className="alert-icon">❌</span>
          <div>
            <h3>{result.message || "Certificate Not Verified"}</h3>
            <p>
              The certificate could not be verified against the blockchain record.
              Please check the Certificate ID and try again.
            </p>
          </div>
        </div>

        {error && <div className="student-inline-error">{error}</div>}
      </div>
    );
  };

  return (
    <div className="student-page-shell">
      <header className="student-topbar">
        <div className="student-brand">
          <span className="brand-mark">C</span>
          <span>CertiChain</span>
        </div>

        <nav className="student-nav">
          <Link to="/">Home</Link>
          <Link to="/student">Verify Certificate</Link>
          <Link to="/dashboard">Issuer Login/Dashboard</Link>
        </nav>
      </header>

      <main className="student-main">
        <section className="student-hero">
          <div className="student-hero-copy">
            <p className="student-kicker">Blockchain Academic Verification</p>
            <h1>Verify Your Academic Certificate</h1>
            <p className="student-subtitle">
              Instantly verify the authenticity of your academic credential using blockchain technology.
            </p>

            <div className="student-search-box">
              <label htmlFor="certificateId" className="sr-only">Certificate ID</label>
              <input
                id="certificateId"
                type="text"
                value={certificateId}
                onChange={(event) => setCertificateId(event.target.value)}
                placeholder="Enter Certificate ID"
              />
              <button type="button" className="primary-btn" onClick={() => verifyCertificate(certificateId)} disabled={loading}>
                {loading ? "Verifying..." : "Verify Certificate"}
              </button>
            </div>

            <div className="student-example-row">
              <span>Example:</span>
              <button type="button" className="example-chip" onClick={() => setCertificateId("CERT-101")}>
                CERT-101
              </button>
            </div>
          </div>

          <div className="student-hero-panel">
            <div className="security-badge-wrap">
              <div className="security-badge">✓</div>
              <div>
                <strong>Blockchain Secure</strong>
                <p>Verified on-chain record</p>
              </div>
            </div>

            <div className="feature-stack">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div>
                  <h4>Secure verification</h4>
                  <p>Certificate data is checked against the blockchain ledger.</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div>
                  <h4>Instant results</h4>
                  <p>Fast validation for students, employers, and institutions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="student-result-section">
          {renderResult()}
        </section>

        {result && result.status === "valid" && result.certificate && (
          <section className="student-actions-row">
            <button type="button" className="secondary-btn" onClick={handleCopyLink}>
              Copy Verification Link
            </button>
            <button type="button" className="primary-btn" onClick={handlePrint}>
              Print Verification
            </button>
          </section>
        )}

        {qrValue && (
          <section className="student-qr-panel">
            <div>
              <p className="student-kicker">QR verification</p>
              <h3>Share this verification link</h3>
            </div>

            <div className="qr-wrapper">
              <img
                alt="Verification QR"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`}
              />
            </div>

            <div className="qr-link">{qrValue}</div>
          </section>
        )}
      </main>
    </div>
  );
}

export default StudentPortal;
