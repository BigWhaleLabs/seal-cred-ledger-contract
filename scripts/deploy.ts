import { ethers } from "hardhat";

async function main() {
  const StreetCred = await ethers.getContractFactory("StreetCred");
  const streetCred = await StreetCred.deploy();

  await streetCred.deployed();

  console.log("StreetCred deployed to:", streetCred.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
