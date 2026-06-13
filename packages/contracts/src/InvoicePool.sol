// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract InvoicePool {
    address public immutable freelancer;
    address public immutable agent;
    uint256 public immutable targetAmount;
    uint256 public immutable clientPaymentAmount;
    uint256 public immutable agentFeeBasisPoints; // e.g., 150 = 1.5%
    IERC20 public immutable usdc;

    uint256 public totalRaised;
    bool public funded;
    bool public settled;

    mapping(address => uint256) public deposits;
    address[] public investors;

    event Deposit(address indexed investor, uint256 amount);
    event Funded(address indexed freelancer, uint256 amount);
    event Settled(uint256 totalDistributed, uint256 agentFee);

    error PoolFunded();
    error PoolNotFunded();
    error AlreadySettled();
    error InsufficientPayment();

    constructor(
        address _freelancer,
        address _agent,
        uint256 _targetAmount,
        uint256 _clientPaymentAmount,
        uint256 _agentFeeBasisPoints,
        address _usdc
    ) {
        freelancer = _freelancer;
        agent = _agent;
        targetAmount = _targetAmount;
        clientPaymentAmount = _clientPaymentAmount;
        agentFeeBasisPoints = _agentFeeBasisPoints;
        usdc = IERC20(_usdc);
    }

    function deposit(uint256 amount) external {
        if (funded) revert PoolFunded();

        if (deposits[msg.sender] == 0) {
            investors.push(msg.sender);
        }

        usdc.transferFrom(msg.sender, address(this), amount);
        totalRaised += amount;
        deposits[msg.sender] += amount;

        emit Deposit(msg.sender, amount);

        if (totalRaised >= targetAmount) {
            funded = true;
            usdc.transfer(freelancer, targetAmount);
            emit Funded(freelancer, targetAmount);
        }
    }

    function settle(uint256 paymentAmount) external {
        if (!funded) revert PoolNotFunded();
        if (settled) revert AlreadySettled();
        if (paymentAmount < clientPaymentAmount) revert InsufficientPayment();

        usdc.transferFrom(msg.sender, address(this), paymentAmount);

        uint256 agentFee = (paymentAmount * agentFeeBasisPoints) / 10000;
        uint256 distributableAmount = paymentAmount - agentFee;

        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investorShare = (distributableAmount * deposits[investor]) / totalRaised;
            usdc.transfer(investor, investorShare);
        }

        usdc.transfer(agent, agentFee);
        settled = true;

        emit Settled(distributableAmount, agentFee);
    }
}
