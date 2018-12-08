pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

contract Smartcop is DetailedERC20, StandardToken {

    address owner;
    address finalizer;

    event Burn(address burner, uint256 value);

    constructor() public
        DetailedERC20("Azilowon", "AWN", 18)
    {
        totalSupply_ = 1000000000 * (uint(10)**decimals);
        balances[msg.sender] = totalSupply_;
        owner = msg.sender;
    }

    function setFinalizer(address _finalizer) public {
        require(msg.sender == owner, "Only owner can call this");
        finalizer = _finalizer;
    }

    function burn(uint256 _value) public {
        require(msg.sender == finalizer, "Only crowdsale can call this");
        require(_value <= balances[owner], "A value greater than owner's balance cannot be burned");
        // no need to require value <= totalSupply, since that would imply the
        // sender's balance is greater than the totalSupply, which *should* be an assertion failure   
        balances[owner] = balances[owner].sub(_value);
        totalSupply_ = totalSupply_.sub(_value);
        emit Burn(owner, _value);
        emit Transfer(owner, address(0), _value);
    }
}