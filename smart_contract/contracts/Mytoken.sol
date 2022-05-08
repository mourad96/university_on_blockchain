// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(address _manager, uint _initialSupply) ERC20("MyToken", "MTK") {
        _mint(_manager, _initialSupply * 10 ** decimals());
    }

}
