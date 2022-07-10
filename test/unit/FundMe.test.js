const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")

describe("FundMe", async function () {
  let deployer
  let fundme
  let mockV3Aggregator
  const sendValue = ethers.utils.parseEther("1")
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])
    fundme = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })
  describe("contructor", async function () {
    it("sets the aggregator adresses correctly", async function () {
      const response = await fundme.s_priceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })
  describe("fund", async function () {
    it("fails if not send enough ETH", async function () {
      await expect(fundme.fund()).to.be.revertedWith(
        "amount lesser than required minimum"
      )
    })
    it("update the amount funded data structure", async function () {
      await fundme.fund({ value: sendValue })
      const response = await fundme.s_addressToAmountFunded(deployer)
      assert.equal(response.toString(), sendValue.toString())
    })
    it("adds funder to array of s_funders", async function () {
      await fundme.fund({ value: sendValue })
      const funder = await fundme.s_funders(0)
      assert.equal(funder, deployer)
    })
  })
  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundme.fund({ value: sendValue })
    })
    it("withdraw ETH from a single funder", async function () {
      // arrange
      const startingFundmeBalance = await fundme.provider.getBalance(
        fundme.address
      )
      const startingDeployerBalance = await fundme.provider.getBalance(deployer)
      // act
      const transactionResponse = await fundme.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const {gasUsed,effectiveGasPrice} = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)
      const endingFundmeBalance = await fundme.provider.getBalance(
        fundme.address
      )
      const endingDeployerBalance = await fundme.provider.getBalance(deployer)
      // assert
      assert.equal(endingFundmeBalance, 0)
      assert.equal(
        startingFundmeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
    })
    it("witdraws from multiple s_funders", async function() {
      // arrange
      const accounts = await ethers.getSigners()
      for(let i=1;i<6;i++) {
        const fundmeConnectedContract = await fundme.connect(accounts[i])
        await fundmeConnectedContract.fund({value: sendValue})
      }
      const startingFundmeBalance = await fundme.provider.getBalance(
        fundme.address
      )
      const startingDeployerBalance = await fundme.provider.getBalance(deployer)
      // act
      const transactionResponse = await fundme.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const {gasUsed,effectiveGasPrice} = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)
      const endingFundmeBalance = await fundme.provider.getBalance(
        fundme.address
      )
      const endingDeployerBalance = await fundme.provider.getBalance(deployer)
      // assert
      assert.equal(endingFundmeBalance, 0)
      assert.equal(
        startingFundmeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
      await expect(fundme.s_funders(0)).to.be.reverted
      for(i=1;i<6;i++) {
        assert.equal(await fundme.s_addressToAmountFunded(accounts[i].address),0)
      }
    })
    it('only allows the owner to withdraw', async function() {
      const accounts = await ethers.getSigners()
      const attackerConnectedContract = await fundme.connect(accounts[1])
      await expect(attackerConnectedContract.withdraw()).to.be.revertedWith('FundMe__NotOwner')
    })
  })
})
