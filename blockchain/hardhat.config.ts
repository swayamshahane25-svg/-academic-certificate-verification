import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],

  solidity: {
    version: "0.8.34",
  },

  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
});