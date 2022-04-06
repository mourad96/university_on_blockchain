const project = artifacts.require("PersonCreation");
const token = artifacts.require('MyToken');
const utils = require("./helpers/utils");
var chai = require("chai");

const BN = web3.utils.BN;
const chaiBN = require('chai-bn')(BN);
chai.use(chaiBN);

var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;
const StudentsNames = ["ali", "mo"];

contract("project", (accounts) => {
    let [university,alice, bob] = accounts;
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await project.new();
        instance = await token.deployed();
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
    context("with the single-step transfer scenario1", async () => {
        it("should verrify balance of token", async () => {
            let totalSupply = await instance.totalSupply();
            await expect(instance.balanceOf(university)).to.eventually.be.a.bignumber.equal(totalSupply);
            await expect(instance.balanceOf(alice)).to.eventually.be.a.bignumber.equal(new BN(0));
        })
        it("I can send tokens from Account 1 to Account 2", async () => {
            const sendTokens = 5;
            let totalSupply = await instance.totalSupply();
            await expect(instance.balanceOf(university)).to.eventually.be.a.bignumber.equal(totalSupply);
            await expect(instance.transfer(alice, sendTokens)).to.eventually.be.fulfilled;      
            await expect(instance.balanceOf(university)).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));
            await expect(instance.balanceOf(alice)).to.eventually.be.a.bignumber.equal(new BN(sendTokens));
          });
          it("send from alice to bob", async () => {
            await expect(instance.transfer(bob,1,{from:alice})).to.eventually.be.fulfilled;
            await expect(instance.balanceOf(alice)).to.eventually.be.a.bignumber.equal(new BN(4));
            await expect(instance.balanceOf(bob)).to.eventually.be.a.bignumber.equal(new BN(1));
      
          });
          it("It's not possible to send more tokens than account 1 has", async () => {
            await expect(instance.transfer(bob,5,{from:alice})).to.eventually.be.rejected;
      
            //check if the balance is still the same
            await expect(instance.balanceOf(alice)).to.eventually.be.a.bignumber.equal(new BN(4));
      
          });
          
    })
    context("with the single-step transfer scenario 2", async () => {

    })
})