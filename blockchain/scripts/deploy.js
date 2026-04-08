const hre = require("hardhat");

async function main() {
  const CertChain = await hre.ethers.getContractFactory("CertChain");
  const certChain = await CertChain.deploy();
  await certChain.waitForDeployment();
  const address = await certChain.getAddress();
  console.log("CertChain deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});