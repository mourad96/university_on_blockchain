const project = artifacts.require("PersonCreation");
const token = artifacts.require('MyToken');
const token_manager = artifacts.require('MultiSigTokenManager');
var chai = require("chai");

const BN = web3.utils.BN;
const chaiBN = require('chai-bn')(BN);
chai.use(chaiBN);

var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;
const StudentsNames = ["alice", "bob"];

contract("project", (accounts) => {
    let [university,alice, bob] = accounts;
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await project.new();
        TokenInstance = await token.deployed();
        TokenManager = await token_manager.deployed();
    });
    it("should be able to create a new student", async () => {
        const result = await contractInstance.Creat_Student(StudentsNames[0],5,"msse",true, {from: alice});
        expect(result.receipt.status).to.equal(true);
        expect(result.logs[0].args.name).to.equal(StudentsNames[0]);
    })
    it("should not allow two accounts for the same student", async () => {
        await contractInstance.Creat_Student(StudentsNames[0],5,"msse",true, {from: alice});
        await expect(contractInstance.Creat_Student(StudentsNames[1],5,"msse",true, {from: alice})).to.eventually.be.rejected;
    })
    context("test Multi signature transfer ", async () => {
        it("should verrify balance of token", async () => {
            let totalSupply = await TokenInstance.totalSupply();
            const contract_address = await TokenManager.address;
            await expect(TokenInstance.balanceOf(contract_address)).to.eventually.be.a.bignumber.equal(totalSupply);
            await expect(TokenInstance.balanceOf(university)).to.eventually.be.a.bignumber.equal(new BN(0));
        })
        it("I can send tokens from Account 1 to Account 2", async () => {
            const sendTokens = 5;
            let totalSupply = await TokenInstance.totalSupply();
            const contract_address = await TokenManager.address;
            await expect(TokenManager.setMyTokenAddress(TokenInstance.address)).to.eventually.be.fulfilled;
            await expect(TokenInstance.balanceOf(contract_address)).to.eventually.be.a.bignumber.equal(totalSupply);
            await expect(TokenInstance.transfer(alice, sendTokens)).to.eventually.be.rejected;
            await expect(TokenManager.submitTransaction(alice, sendTokens,0x00,"MTK",{from: university})).to.eventually.be.fulfilled;
            await expect(TokenManager.confirmTransaction(0,{from: alice})).to.eventually.be.fulfilled;
            await expect(TokenManager.executeTransaction(0,{from: alice})).to.eventually.be.rejected; 
            await expect(TokenManager.confirmTransaction(0,{from: university})).to.eventually.be.fulfilled; 
            await expect(TokenManager.executeTransaction(0,{from: alice})).to.eventually.be.fulfilled;         
            await expect(TokenInstance.balanceOf(contract_address)).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));
            await expect(TokenInstance.balanceOf(alice)).to.eventually.be.a.bignumber.equal(new BN(sendTokens));
          });
          it("send from alice to bob", async () => {
            await expect(TokenInstance.transfer(bob,1,{from:alice})).to.eventually.be.fulfilled;
            await expect(TokenInstance.balanceOf(alice)).to.eventually.be.a.bignumber.equal(new BN(4));
            await expect(TokenInstance.balanceOf(bob)).to.eventually.be.a.bignumber.equal(new BN(1));
      
          });
          it("It's not possible to send more tokens than account 1 has", async () => {
            await expect(TokenInstance.transfer(bob,5,{from:alice})).to.eventually.be.rejected;
      
            //check if the balance is still the same
            await expect(TokenInstance.balanceOf(alice)).to.eventually.be.a.bignumber.equal(new BN(4));
      
          });
          it("send ether from alice to contract manager", async () => {
            let balance = await web3.eth.getBalance(TokenManager.address);
            assert.equal(balance, 0);
            let one_eth = web3.utils.toWei('1', "ether");
            //let one_eth = {value: utils.parseUnits("0.01")}
            await web3.eth.sendTransaction({from: accounts[1], to: TokenManager.address, value: one_eth});
            let balance_wei = await web3.eth.getBalance(TokenManager.address);
            let balance_ether = web3.utils.fromWei(balance_wei, "ether");
            assert.equal(balance_ether, 1);
          });
          it("send ether from contract manager to alice", async () => {
            let half_eth = web3.utils.toWei('0.5', "ether");
            let balance_wei_alice_old = await web3.eth.getBalance(alice);

            await expect(TokenManager.submitTransaction(alice, half_eth,0x00,"ETH",{from: university})).to.eventually.be.fulfilled;
            let transcationIndex = await TokenManager.getTransactionCount()
            assert.equal(transcationIndex, 2);
            await expect(TokenManager.confirmTransaction(transcationIndex - 1,{from: alice})).to.eventually.be.fulfilled;
            await expect(TokenManager.executeTransaction(transcationIndex - 1,{from: alice})).to.eventually.be.rejected; 
            await expect(TokenManager.confirmTransaction(transcationIndex - 1,{from: university})).to.eventually.be.fulfilled; 
            await expect(TokenManager.executeTransaction(transcationIndex - 1,{from: alice})).to.eventually.be.fulfilled;  
      
            let balance_wei_alice_new = await web3.eth.getBalance(alice);
            let balance_ether = web3.utils.fromWei((balance_wei_alice_new - balance_wei_alice_old).toString(), "ether");
            //assert.equal(balance_ether, 0.5 - gas_fee_ether);
            //console.log(balance_ether);
          });
    })
})