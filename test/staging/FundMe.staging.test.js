const { assert } = require('chai')
const { network, ethers, getNamedAccounts } = require('hardhat')
const {devChains} = require('../../helper-hardhat-config')

devChains.includes(network.name) ? describe.skip : 
describe('FundMe', async function() {
  let fundme
  let deployer
  const sendValue = await ethers.utils.parseEther('1')
  beforeEach(async function() {
    deployer = (await getNamedAccounts()).deployer
    fundme = await ethers.getContract('FundMe',deployer) // contract is already deployed on testnet
  })
  it('can fund and withdraw', async function() {
    await fundme.fund({value: sendValue})
    await fundme.withdraw()
    const endingBalance = await fundme.provider.getBalance(fundme.address)
    assert.equal(endingBalance.toString(),'0')
  })
})