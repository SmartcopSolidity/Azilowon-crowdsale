var Smartcop = artifacts.require("./Smartcop.sol")
var Smartcop_Crowdfund = artifacts.require('./Smartcop_Crowdfund.sol')


module.exports = function (deployer, _, accounts) {
    var kycSigner = [],
        wallet = accounts[0],        
        // Deploy 3 days before ICO starts
        startTime = web3.eth.getBlock("latest").timestamp + 259200,
        // 4 weeks ICO
        endTime = startTime + ( 604800 * 4),

        // rate is $ = ETH/rate
        rate = 18000,
        // this cap amount should be set as total wei that wants to be raised in ICO
        cap = 18e22
        // this is 180.000 ETH rough
    
    deployer.deploy(Smartcop).then(function(sc) {
        return sc.totalSupply().then(function(totSupply) {
            return deployer.deploy(Smartcop_Crowdfund, kycSigner, sc.address, 
            wallet, rate, startTime, endTime, cap).then(function(scr) {
                return sc.approve(scr.address, totSupply).then(function(val){
                    sc.setFinalizer(scr.address).then(function(){
                        return val
                    })
                })
            })
        })
    })
}
