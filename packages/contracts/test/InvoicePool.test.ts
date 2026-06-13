import { expect } from "chai";
import { ethers } from "hardhat";

const USDC = 1_000_000n; // 1 USDC = 1e6 base units
const TARGET = 4900n * USDC;
const CLIENT_PAYMENT = 5000n * USDC;
const FEE_BPS = 150n;

async function deployFixture() {
  const [freelancer, agent, inv1, inv2, inv3, client] =
    await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  const InvoicePool = await ethers.getContractFactory("InvoicePool");
  const pool = await InvoicePool.deploy(
    freelancer.address,
    agent.address,
    TARGET,
    CLIENT_PAYMENT,
    FEE_BPS,
    await usdc.getAddress()
  );
  await pool.waitForDeployment();

  return { usdc, pool, freelancer, agent, inv1, inv2, inv3, client };
}

async function fundInvestor(usdc: any, pool: any, investor: any, amount: bigint) {
  await usdc.mint(investor.address, amount);
  await usdc.connect(investor).approve(await pool.getAddress(), amount);
  await pool.connect(investor).deposit(amount);
}

describe("InvoicePool", () => {
  it("deposits accumulate and freelancer receives funds when target reached", async () => {
    const { usdc, pool, freelancer, inv1, inv2, inv3 } = await deployFixture();

    const before = await usdc.balanceOf(freelancer.address);
    await fundInvestor(usdc, pool, inv1, 1500n * USDC);
    await fundInvestor(usdc, pool, inv2, 1500n * USDC);
    await fundInvestor(usdc, pool, inv3, 1900n * USDC);

    expect(await pool.funded()).to.equal(true);
    expect((await usdc.balanceOf(freelancer.address)) - before).to.equal(TARGET);
    expect(await pool.investors(0)).to.equal(inv1.address);
    expect(await pool.investors(1)).to.equal(inv2.address);
    expect(await pool.investors(2)).to.equal(inv3.address);
  });

  it("settle distributes proportionally and pays agent fee", async () => {
    const { usdc, pool, agent, inv1, inv2, inv3, client } = await deployFixture();

    await fundInvestor(usdc, pool, inv1, 1500n * USDC);
    await fundInvestor(usdc, pool, inv2, 1500n * USDC);
    await fundInvestor(usdc, pool, inv3, 1900n * USDC);

    await usdc.mint(client.address, CLIENT_PAYMENT);
    await usdc.connect(client).approve(await pool.getAddress(), CLIENT_PAYMENT);
    await pool.connect(client).settle(CLIENT_PAYMENT);

    const agentFee = (CLIENT_PAYMENT * FEE_BPS) / 10000n; // 75 USDC
    const distributable = CLIENT_PAYMENT - agentFee; // 4925 USDC
    const share1 = (distributable * (1500n * USDC)) / TARGET; // 1507.653061 USDC
    const share3 = (distributable * (1900n * USDC)) / TARGET; // 1909.693877 USDC

    expect(await usdc.balanceOf(agent.address)).to.equal(agentFee);
    expect(await usdc.balanceOf(inv1.address)).to.equal(share1);
    expect(await usdc.balanceOf(inv2.address)).to.equal(share1);
    expect(await usdc.balanceOf(inv3.address)).to.equal(share3);
    expect(await pool.settled()).to.equal(true);

    const totalDistributed = share1 + share1 + share3;
    expect(totalDistributed).to.be.lte(distributable);
  });

  it("settle reverts if not funded", async () => {
    const { usdc, pool, client } = await deployFixture();

    await usdc.mint(client.address, CLIENT_PAYMENT);
    await usdc.connect(client).approve(await pool.getAddress(), CLIENT_PAYMENT);
    await expect(
      pool.connect(client).settle(CLIENT_PAYMENT)
    ).to.be.revertedWithCustomError(pool, "PoolNotFunded");
  });

  it("settle reverts if already settled", async () => {
    const { usdc, pool, inv1, inv2, inv3, client } = await deployFixture();

    await fundInvestor(usdc, pool, inv1, 1500n * USDC);
    await fundInvestor(usdc, pool, inv2, 1500n * USDC);
    await fundInvestor(usdc, pool, inv3, 1900n * USDC);

    await usdc.mint(client.address, CLIENT_PAYMENT * 2n);
    await usdc.connect(client).approve(await pool.getAddress(), CLIENT_PAYMENT * 2n);
    await pool.connect(client).settle(CLIENT_PAYMENT);

    await expect(
      pool.connect(client).settle(CLIENT_PAYMENT)
    ).to.be.revertedWithCustomError(pool, "AlreadySettled");
  });

  it("deposit reverts if funded", async () => {
    const { usdc, pool, inv1, inv2, inv3, client } = await deployFixture();

    await fundInvestor(usdc, pool, inv1, 1500n * USDC);
    await fundInvestor(usdc, pool, inv2, 1500n * USDC);
    await fundInvestor(usdc, pool, inv3, 1900n * USDC);

    await usdc.mint(client.address, 100n * USDC);
    await usdc.connect(client).approve(await pool.getAddress(), 100n * USDC);
    await expect(
      pool.connect(client).deposit(100n * USDC)
    ).to.be.revertedWithCustomError(pool, "PoolFunded");
  });
});
