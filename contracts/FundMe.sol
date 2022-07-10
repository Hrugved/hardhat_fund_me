// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
  using PriceConverter for uint256;

  uint256 public constant MIN_USD = 50 * 1e18;
  address[] public s_funders;
  mapping(address => uint256) public s_addressToAmountFunded;
  address public immutable i_owner;
  AggregatorV3Interface public s_priceFeed;

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

  function fund() public payable {
    require(
      msg.value.getConversionRate(s_priceFeed) >= MIN_USD,
      "amount lesser than required minimum"
    );
    s_funders.push(msg.sender);
    s_addressToAmountFunded[msg.sender] += msg.value;
  }

  function withdraw() public onlyOwner {
    for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++) {
      address funder = s_funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }("");
    require(callSuccess, "call failed");
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }
}
