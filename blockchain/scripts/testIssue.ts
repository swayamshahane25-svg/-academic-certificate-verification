import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const contractAddress =
    "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";

  const contract =
    await ethers.getContractAt(
      "CertificateRegistry",
      contractAddress
    );

  console.log("Testing contract...");
  console.log("Address:", contractAddress);

  const countBefore =
    await contract.getCertificateCount();

  console.log(
    "Certificates before:",
    countBefore.toString()
  );

  console.log("Issuing test certificate...");

  const tx =
    await contract.issueCertificate(
      "DIRECT-TEST-001",
      "Swayam",
      "B.Tech Computer Science",
      "Computer Science",
      "MGM University",
      "abc123-test-hash",
      "MGM University"
    );

  await tx.wait();

  console.log("SUCCESS!");
  console.log("Transaction:", tx.hash);

  const countAfter =
    await contract.getCertificateCount();

  console.log(
    "Certificates after:",
    countAfter.toString()
  );
}

main().catch((error) => {
  console.error("ERROR:");
  console.error(error);
  process.exitCode = 1;
});
