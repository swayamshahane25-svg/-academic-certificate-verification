import { expect } from "chai";
import { network } from "hardhat";

describe("CertificateRegistry", function () {
  async function deployContract() {
    const { ethers } = await network.connect();

    const certificateRegistry =
      await ethers.deployContract("CertificateRegistry");

    await certificateRegistry.waitForDeployment();

    return { certificateRegistry, ethers };
  }

  it("should issue a certificate", async function () {
    const { certificateRegistry } = await deployContract();

    await certificateRegistry.issueCertificate(
      "CERT-001",
      "",
      "",
      "",
      "ABC University",
      "35d3fc4732270cf1296897f28efbcc421a427af6106a574a4c9003d837c7bf6d",
      "TestIssuer"
    );

    const result = await certificateRegistry.verifyCertificate(
      "CERT-001",
      "35d3fc4732270cf1296897f28efbcc421a427af6106a574a4c9003d837c7bf6d"
    );

    expect(result[0]).to.equal(true);
    // university is at index 4 in the current contract return tuple
    expect(result[4]).to.equal("ABC University");
    // revoked is at index 7 and should be false
    expect(result[7]).to.equal(false);
  });

  it("should reject an incorrect certificate hash", async function () {
    const { certificateRegistry } = await deployContract();

    await certificateRegistry.issueCertificate(
      "CERT-002",
      "",
      "",
      "",
      "ABC University",
      "original-hash",
      "TestIssuer"
    );

    const result = await certificateRegistry.verifyCertificate(
      "CERT-002",
      "wrong-hash"
    );

    expect(result[0]).to.equal(false);
  });

  it("should revoke a certificate", async function () {
    const { certificateRegistry } = await deployContract();

    await certificateRegistry.issueCertificate(
      "CERT-003",
      "",
      "",
      "",
      "ABC University",
      "certificate-hash",
      "TestIssuer"
    );

    await certificateRegistry.revokeCertificate("CERT-003");

    const result = await certificateRegistry.verifyCertificate(
      "CERT-003",
      "certificate-hash"
    );

    expect(result[0]).to.equal(true);
    // revoked flag at index 7
    expect(result[7]).to.equal(true);
  });
});