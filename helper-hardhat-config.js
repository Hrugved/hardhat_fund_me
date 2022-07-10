const networkConfig = {
  5: {
    name: "goerli",
    ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
  },
}

const devChains = ['hardhat','localhost']
const DECIMALS = "8"
const INITIAL_ANSWER = "200000000000"

module.exports = {
  networkConfig,
  devChains,
  DECIMALS,
  INITIAL_ANSWER
}