import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

// const provider = waffle.provider;

const correctUnlockCode = ethers.utils.id("test"); // test is the password
const timestampLockedFrom = Math.round(Date.now() / 1000) + 3; // lock it in 3 seconds to test unlock
const unlockCodeHash = ethers.utils.id(correctUnlockCode); // double hashed

describe("AisthisiToken: test mint and lock", async () => {
  const [owner, addr1, addr2] = await ethers.getSigners();

  let token: Contract;

  beforeEach(async () => {
    const AisthisiToken = await ethers.getContractFactory("AisthisiToken");
    token = await AisthisiToken.deploy();
    await token.deployed();
  });

  it("is possible to mint tokens for the minter role", async () => {
    await token._mint(addr1.address, timestampLockedFrom, unlockCodeHash); // minting works
    expect(token.transferFrom(owner.address, addr1.address, 0)); // transferring for others doesn't work

    // but transferring in general works
    await expect(
      token.transferFrom(addr1.address, addr2.address, 0, {
        from: addr1.address,
      })
    ).to.satisfy;
  });

  it("is not possible to transfer locked tokens", async () => {
    // unless we wait 4 seconds and the token will be locked
    // const token = await AisthisiToken.deploy();
    await new Promise((resolve) => {
      setTimeout(resolve, 4000);
    });
    await expect(
      token.transferFrom(addr2.address, addr1.address, 0, {
        from: addr2.address,
      })
    ).to.be.reverted;
  });

  it("is not possible to unlock tokens for anybody else than the token holder", async () => {
    // const token = await AisthisiToken.deploy();
    await expect(
      token.unlockToken(correctUnlockCode, 0, { from: owner.address })
    ).to.be.reverted;
  });

  it("is not possible to unlock tokens without the correct unlock code", async () => {
    // const token = await AisthisiToken.deploy();
    const wrongUnlockCode = ethers.utils.id("Santa Lucia");
    await expect(token.unlockToken(wrongUnlockCode, 0, { from: addr2.address }))
      .reverted;
  });

  it("is possible to unlock the token and transfer it again", async () => {
    // const token = await AisthisiToken.deploy();
    expect(token.unlockToken(correctUnlockCode, 0, { from: addr2.address }));
    expect(
      token.transferFrom(addr2.address, owner.address, 0, {
        from: addr2.address,
      })
    );
    const tokenOwner = await token.ownerOf(0);
    expect(tokenOwner).to.equal(owner.address);
  });

  it("is possible to retrieve the correct token URI", async () => {
    // const token = await AisthisiToken.deploy();
    const metadata = await token.tokenURI(0);
    expect("https://aisthisi.art/metadata/0.json").to.equal(metadata);
  });
});
