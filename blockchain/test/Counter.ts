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
      "35d3fc4732270cf1296897f28efbcc421a427af6106a574a4c9003d837c7bf6d",
      "ABC University"
    );

    const result = await certificateRegistry.verifyCertificate(
      "CERT-001",
      "35d3fc4732270cf1296897f28efbcc421a427af6106a574a4c9003d837c7bf6d"
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal("ABC University");
    expect(result[3]).to.equal(false);
  });

  it("should reject an incorrect certificate hash", async function () {
    const { certificateRegistry } = await deployContract();

    await certificateRegistry.issueCertificate(
      "CERT-002",
      "original-hash",
      "ABC University"
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
      "certificate-hash",
      "ABC University"
    );

    await certificateRegistry.revokeCertificate("CERT-003");

    const result = await certificateRegistry.verifyCertificate(
      "CERT-003",
      "certificate-hash"
    );

    expect(result[0]).to.equal(true);
    expect(result[3]).to.equal(true);
  });
});