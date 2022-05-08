pragma solidity ^0.8.4;
// SPDX-License-Identifier: MIT

contract MultiSigTokenManager {

    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data,
        string TokenType,
        string DiplomaURI
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    address public myTokenAddress;
    address public myDiplomaAddress;
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public numConfirmationsRequired;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        string TokenType;
        string DiplomaURI;
        bool executed;
        uint numConfirmations;
    }

    // mapping from tx index => owner => bool
    mapping(uint => mapping(address => bool)) public isConfirmed;

    Transaction[] public transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }
    modifier addressIsNotEmpty() {
        require(myTokenAddress != address(0), "Token Address is empty!");
        require(myDiplomaAddress != address(0), "Diploma Address is empty!");
        _;
    }
    constructor(address[] memory _owners, uint _numConfirmationsRequired){
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }
    
        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function setMyTokenAddress(address _myTokenAddress) public onlyOwner {
        myTokenAddress = _myTokenAddress;
    }
    function setMyDiplomaAddress(address _myDiplomaAddress) public onlyOwner {
        myDiplomaAddress = _myDiplomaAddress;
    }

    function submitTransaction(
        address _to,
        uint _value,
        bytes memory _data,
        string memory _TokenType,
        string memory _DiplomaURI
    ) public onlyOwner {
        uint txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                TokenType: _TokenType,
                DiplomaURI: _DiplomaURI,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data,_TokenType,_DiplomaURI);
    }

    function confirmTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );
        if(keccak256(bytes(transaction.TokenType)) == keccak256(bytes("ETH"))){
            (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data);
            require(success,"transfer ether failed");
        }
        else if(keccak256(bytes(transaction.TokenType)) == keccak256(bytes("Diploma"))){
            (bool success, ) = myDiplomaAddress.call(abi.encodeWithSignature("safeMint(address,uint256,string)",transaction.to,transaction.value,transaction.DiplomaURI));
            require(success,"Diploma Creation failed");
        }
        else if(keccak256(bytes(transaction.TokenType)) == keccak256(bytes("MTK"))) {
            (bool success, ) = myTokenAddress.call(abi.encodeWithSignature("transfer(address,uint256)",transaction.to,transaction.value));
            require(success,"transfer Token failed");
        }
        else{
             require(false,"no existing TokenType");
        }
        transaction.executed = true;
        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txIndex)
        public
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}