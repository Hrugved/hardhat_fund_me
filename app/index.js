import { ethers } from "./ethers-5.2.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
connectButton.onclick = connect
const fundButton = document.getElementById("fundButton")
fundButton.onclick = fund
const getBalanceButton = document.getElementById("getBalanceButton")
getBalanceButton.onclick = getBalance
const withdrawButton = document.getElementById("withdrawButton")
withdrawButton.onclick = withdraw

async function connect() {
  if (typeof window.ethereum !== undefined) {
    await window.ethereum.request({ method: "eth_requestAccounts" })
    connectButton.innerHTML = "connected"
  } else {
    connectButton.innerHTML = "please install metamask"
  }
}

async function getBalance() {
  if(typeof window.ethereum !== undefined) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const balance = await provider.getBalance(contractAddress)
    console.log(ethers.utils.formatEther(balance))
  }
}

async function withdraw() {
  if(typeof window.ethereum !== undefined) {
    console.log('withdrawing...')
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = await provider.getSigner()
    const contract = new ethers.Contract(contractAddress,abi,signer)
    try {
      const transactionResponse = await contract.withdraw()
      await listenForTransationMine(transactionResponse,provider)
    } catch (error) {
      console.log(error)
    }
  }
}

async function fund() {
  const ethAmount = document.getElementById('ethAmount').value
  console.log(`funding with ${ethAmount}`)
  if (typeof window.ethereum !== undefined) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      })
      await listenForTransationMine(transactionResponse,provider)
    } catch (error) {
      console.log(error);
    }
  }
}

function listenForTransationMine(transactionResponse,provider) {
  console.log(`Mining ${transactionResponse.hash}...`)
  return new Promise((resolve,reject) => {
    provider.once(transactionResponse.hash,(transactionReceipt)=>{
      console.log(`completed with ${transactionReceipt.confirmations} confirmations`)
      resolve()
    })
  })
}
