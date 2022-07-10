// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error FundMe__NotOwner(); // cheaper than revert statements with stringsm which are needed to be stored on chain

contract FundMe {
  using PriceConverter for uint256;

  uint256 public constant MIN_USD = 50 * 1e18;
  address[] private s_funders;
  mapping(address => uint256) private s_addressToAmountFunded;
  address private immutable i_owner;
  AggregatorV3Interface private s_priceFeed;

  constructor(address priceFeedAddress) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  modifier onlyOwner() {
    if (msg.sender != i_owner) {
      revert FundMe__NotOwner();
    }
    _;
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  function fund() public payable {
    require(
      msg.value.getConversionRate(s_priceFeed) >= MIN_USD,
      "amount lesser than required minimum"
    );
    s_funders.push(msg.sender);
    s_addressToAmountFunded[msg.sender] += msg.value;
  }

  function withdraw() public onlyOwner {
    // reading from storage is expensive, 
    // so better to read entire array first into memory and the interact with it (gas optimization)
    address[] memory funders = s_funders;
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }("");
    require(callSuccess, "call failed");
  }

  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getFunder(uint256 index) public view returns (address) {
    return s_funders[index];
  }

  function getAddressToAmountFunded(address funder) public view returns (uint256) {
    return s_addressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }

}
