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

    // To implement next prompt:
    // function deposit(uint256 amount) external { ... }
    // function settle(uint256 paymentAmount) external { ... }
}
