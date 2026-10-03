import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  console.log("Deploying CertificateRegistry...");

  const certificateRegistry =
    await ethers.deployContract("CertificateRegistry");

  await certificateRegistry.waitForDeployment();

  const address = await certificateRegistry.getAddress();

  console.log("CertificateRegistry deployed to:");
  console.log(address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});