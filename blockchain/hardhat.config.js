require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/WRdUQx1uRHqEc7gtpWBsy",
      accounts: ["ae645d02167757963272057f7e50a66e61cb1085a960c5e8e6b3d10f875350e8"]
    }
  }
};