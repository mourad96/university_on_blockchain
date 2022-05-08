var MultiSigTokenManager = artifacts.require("./MultiSigTokenManager.sol");
var PersonCreation = artifacts.require("./PersonCreation.sol");
var MyToken = artifacts.require("./MyToken.sol");
var Diploma = artifacts.require("./Diploma.sol");

module.exports = async function(deployer,accounts) {
    const ad1 = '0xA94e036e293f88Fac285FC569475c14e2Ec44F77';
    const ad2 = '0xDEEA4BCdCD499CDd4ce188Ea4359B1534e45B40B';
    const ad3 = '0x3d4b57BA0F7608AD7A30A4D9a932Ad5d1c98b0b4';
    const tab = [ad1,ad2,ad3];
    await deployer.deploy(PersonCreation);
    await deployer.deploy(MultiSigTokenManager,tab,2);
    await deployer.deploy(MyToken,MultiSigTokenManager.address,500);
    await deployer.deploy(Diploma,MultiSigTokenManager.address);
};
