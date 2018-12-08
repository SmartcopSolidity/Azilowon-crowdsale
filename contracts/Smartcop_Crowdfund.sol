// Copyright ©2018 Mangrovia Blockchain Solutions – All Right Reserved

pragma solidity ^0.4.24;

import "./icoengine/KYCBase.sol";
import "./icoengine/ICOEngineInterface.sol";
import "./Smartcop.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/price/IncreasingPriceCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";

contract Smartcop_Crowdfund is ICOEngineInterface, KYCBase, Crowdsale,
AllowanceCrowdsale, TimedCrowdsale, CappedCrowdsale
{
    using SafeMath for uint;
    address public scAgent;
    bool public isFinalized;
    Smartcop public burnTok;

    mapping (address => address) TTLaddressICO;
    mapping (address => address) TTLaddressType1;
    mapping (address => address) TTLaddressType2;
    mapping (address => address) TTLaddressType3;

    event PreICOAssign(
        address indexed purchaser,
        uint8 indexed buyerType,
        uint tokens
    );
 
    // we shall hardcode all variables, it will cost less eth to deploy
    constructor(address[] kycSigner,
        address _token, address _wallet,
        uint _price, uint _startTime, uint _endTime, uint _cap)
        Crowdsale(_price, _wallet, ERC20(_token))
        AllowanceCrowdsale(_wallet)
        TimedCrowdsale(_startTime, _endTime)
        CappedCrowdsale(_cap)
        KYCBase(kycSigner) public
    { 
        scAgent = msg.sender;
        token = ERC20(_token);
        burnTok = Smartcop(_token);
        isFinalized = false;
    }

    function started() public view returns(bool) {
        return now >= openingTime;
    }

    function ended() public view returns(bool) {
        return now > closingTime;
    }

    function startTime() public view returns(uint) {
        return openingTime;
    }

    function endTime() public view returns(uint) {
        return closingTime;
    }

    function startBlock() public pure returns(uint) {
        return 0;
    }

    function endBlock() public pure returns(uint) {
        return 0;
    }

    function totalTokens() public view returns(uint) {
        return token.totalSupply();
    }

    function price() public view returns(uint) {
        return rate;
    }

    // from KYCBase
    function releaseTokensTo(address buyer) internal returns(bool) {
        require(!ended(), "ICO has not to be ended");
        require(started(), "ICO has to be started");

        super.buyTokens(buyer);
        return true;
    }

    function getMyTTLICO() public view returns(address) {
        // This return the Timelock contract address 
        // useful in case the buyer forgot the timelock contract address
        return TTLaddressICO[msg.sender];
    }

    function getMyTTLType1() public view returns(address) {
        return TTLaddressType1[msg.sender];
    }

    function getMyTTLType2() public view returns(address) {
        return TTLaddressType2[msg.sender];
    }

    function getMyTTLType3() public view returns(address) {
        return TTLaddressType3[msg.sender];
    }

    function preICOPrivateSale(address buyerAddress, uint amount) public returns(bool) {
        require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
        preICOassignTokensType1(buyerAddress, amount, closingTime, 0,  36288000, closingTime, 70);
    }

    function preICOAdvisorsAndFounders(address buyerAddress, uint amount) public returns(bool) {
        require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
        preICOassignTokensType1(buyerAddress, amount, closingTime, 0,  36288000, closingTime, 70);
    }

    function preICOassignTokensType1(address buyerAddress, uint amount, 
                                    uint startVesting, uint myCliff, uint endVesting, 
                                    uint endLocking, uint8 vestingSplit) internal returns(bool) {
        // require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
        
        address ttl1 = getMyTTLType1();
        address ttl = getMyTTLICO();

        if (ttl1 == 0x0) {
        // this is Private Sale and Advisors/Founders TTL (30% at the end of ICO and then 5% per month)
            ttl1 = new TokenVesting(buyerAddress, startVesting, myCliff, endVesting, false);
        }
        if (ttl == 0x0) {
            ttl = new TokenTimelock(token, buyerAddress, endLocking);
        }
            
        uint tamount = amount.mul(vestingSplit);
        tamount = tamount.div(100);
        super._deliverTokens(ttl1, tamount);
        tamount = amount.mul(100 - vestingSplit);
        tamount = tamount.div(100);
        super._deliverTokens(ttl, tamount);
        TTLaddressType1[buyerAddress] = ttl1;
        TTLaddressICO[buyerAddress] = ttl;

        emit PreICOAssign(buyerAddress, 1, amount);

        return true;
    }

    function preICOCompanyReserve(address buyerAddress, uint amount) public returns(bool) {
        require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
        preICOassignTokensType2(buyerAddress, amount, closingTime.add(15552000), 0, 51840000);
    }

    function preICOassignTokensType2(address buyerAddress, uint amount,
                                    uint startVesting, uint myCliff, uint endVesting) internal returns(bool) {
        // require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
    
        address ttl2 = getMyTTLType2();
        if (ttl2 == 0x0) {
            // this is Company Reserve TTL (6 months lockup and then 20% every 4 months)
            ttl2 = new TokenVesting(buyerAddress, startVesting, myCliff, endVesting, false);
        }
        super._deliverTokens(ttl2, amount);
        TTLaddressType2[buyerAddress] = ttl2;

        emit PreICOAssign(buyerAddress, 2, amount);

        return true;
    }

    function preICOAffiliateMarketing(address buyerAddress, uint amount) public returns(bool) {
        require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
        preICOassignTokensType3(buyerAddress, amount, closingTime, 0, 25920000);
    }

    function preICOCashback(address buyerAddress, uint amount) public returns(bool) {
        require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
        preICOassignTokensType3(buyerAddress, amount, closingTime, 0, 25920000);
    }

    function preICOStrategicPartners(address buyerAddress, uint amount) public returns(bool) {
        require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
        preICOassignTokensType3(buyerAddress, amount, closingTime, 0, 25920000);
    }

    function preICOassignTokensType3(address buyerAddress, uint amount,
                                    uint startVesting, uint myCliff, uint endVesting) internal returns(bool) {
        // require(!started() && msg.sender == scAgent, "ICO has not to be started and msg.sender has to be owner");
    
        address ttl3 = getMyTTLType3();
        if (ttl3 == 0x0) {
            // this is Advisors TTL (10% per month)
            ttl3 = new TokenVesting(buyerAddress, startVesting, myCliff, endVesting, false);
        }
        super._deliverTokens(ttl3, amount);
        TTLaddressType3[buyerAddress] = ttl3;

        emit PreICOAssign(buyerAddress, 3, amount);

        return true;
    }

    function finalize() public {
        require(!isFinalized, "Crowdsale cannot be finalized twice");
        require(ended(), "Crowdsale has to be ended");
        require(msg.sender == scAgent, "can only be called by owner");

        burnTok.burn(token.balanceOf(scAgent));

        isFinalized = true;
    }
}