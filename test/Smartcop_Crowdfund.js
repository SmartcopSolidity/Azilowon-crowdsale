const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

var smartcopCrowd = artifacts.require('Smartcop_Crowdfund')
var smartcop = artifacts.require('Smartcop')
var ttl = artifacts.require('TokenTimelock')

contract('Smartcop_Crowdfund', function ([_, investor, wallet, purchaser]) {
  // const expectedTokenAmount = 18000
  // const tokenSupply = new BigNumber('1e22')
  const purch = web3.eth.accounts[3]
  var lvalue = web3.toWei('1', 'finney')
  // var cap = 1e27 //web3.toWei('10', 'ether')
  var maxAmount = web3.toWei('1', 'ether')

  before(async function () {
    this.token = await smartcop.deployed()
    this.crowdsale = await smartcopCrowd.deployed()
    const supply = await this.token.totalSupply()
  })

  it('Total supply has to be 1e27', async function () {
    console.log("totalTokens Estimate")
    console.log(await this.crowdsale.totalTokens.estimateGas())
    const supply = await this.crowdsale.totalTokens()
    assert.equal(supply, 1e27, 'Tokens total supply must be 18e22')
  })

  it('Rate Test', async function () {
    const price = await this.crowdsale.price()
    console.log("price Estimate")
    console.log(await this.crowdsale.price.estimateGas())
    assert.equal(price, 18000, 'Price should be 18000')
  })

  it('Check Opening time should be false ', async function () {
    var s = await this.crowdsale.started();
    console.log("started Estimate")
    console.log(await this.crowdsale.started.estimateGas())
    assert(s == false, 'crowdfund should not be started')
  })

  it('Check Ending time should be false ', async function () {
    var e = await this.crowdsale.ended();
    console.log("ended Estimate")
    console.log(await this.crowdsale.ended.estimateGas())
    assert(e == false, 'crowdfund should not be ended')
  })

  // BuyTokens failing 
  it('Buy Tokens with beneficiary Bad', async function () {
    await this.crowdsale.buyTokens(purch,
      { from: purch, value: lvalue }).should.not.be.fulfilled
  })
  it('Buy Tokens with nothing Bad', async function () {
    await this.crowdsale.buyTokens(
      { from: purch, value: lvalue }).should.not.be.fulfilled
  })

  it('Buy Tokens has not to work', async function () {
    // for this to pass, it has to be commented out the KYCBase
    // signing verification
    await this.crowdsale.buyTokens(1, maxAmount, 1, 1, 1,
      { from: purch, value: 10000 }).should.not.be.fulfilled
    console.log("buyTokens Estimate")
    //console.log(await this.crowdsale.buyTokens.estimateGas(1, maxAmount, 1, 1, 1,
     // { from: purch, value: 10000 }))
  })

  // Capped testing
  // it('Can buy tokens until cap is reached', async function () {
  //   // for this to pass, it has to be commented out the KYCBase
  //   // signing verification
  //   var intCap = await this.crowdsale.cap()
  //   // console.log("internal cap", intCap)
 
  //   await this.crowdsale.buyTokens(1, intCap, 1, 1, 1,
  //     { from: purch, value: intCap }).should.be.fulfilled

  //   var weiRaised = await this.crowdsale.weiRaised()
  //   // console.log("wei Raised", weiRaised)

  //   var capR = await this.crowdsale.capReached()
  //   assert(capR == true, "Cap should be reached")

  //   const anotherBuyer = web3.eth.accounts[8]
  //   await this.crowdsale.buyTokens(1, maxAmount, 1, 1, 1,
  //     { from: anotherBuyer, value: lvalue }).should.not.be.fulfilled
  // })


  // finalization has to fail during ICO
  it('finalize during ICO shall fail', async function () {
    await this.crowdsale.finalize().should.not.be.fulfilled

  })

  it('PREICO Buy Tokens has to fail', async function () {
    // for this to pass, it has to be commented out the KYCBase
    // signing verification
    const purchaser = web3.eth.accounts[3]
    await this.crowdsale.buyTokens(1, maxAmount, 1, 1, 1,
      { from: purchaser, value: lvalue }).should.not.be.fulfilled
  })

  it('PREICO Buy Tokens with beneficiary Bad', async function () {
    const purchaser = web3.eth.accounts[3]
    await this.crowdsale.buyTokens(purchaser,
      { from: purchaser, value: lvalue }).should.not.be.fulfilled
  })

  it('PREICO Buy Tokens with nothing Bad', async function () {
    await this.crowdsale.buyTokens(
      { from: purchaser, value: lvalue }).should.not.be.fulfilled
  })

  it('PREICO Buy Tokens in pre-ico as customer should fail', async function () {
    await this.crowdsale.preICOCompanyReserve( purchaser, 100, 
      { from: purchaser }).should.not.be.fulfilled
  })

  it('PREICO Buy Tokens in pre-ico type 1 as owner should succeed', async function () {
    await this.crowdsale.preICOPrivateSale( purchaser, 100, 
      ).should.be.fulfilled
    console.log("preICOPrivateSale Estimate")
    console.log(await this.crowdsale.preICOPrivateSale.estimateGas(purchaser, 100))
  })

  it('PREICO Check Tokens in type 1 should be 70 ', async function () {
    var ttl2 = await this.crowdsale.getMyTTLType1( )
    assert(ttl2 == 0, 'TTL address should be 0')
    ttl2 = await this.crowdsale.getMyTTLType1({from: purchaser} )
    assert(ttl2 != 0, 'TTL address should be !=0')
    console.log("getMyTTLType1 Estimate")
    console.log(await this.crowdsale.getMyTTLType1.estimateGas({from: purchaser}))
    var amount = await this.token.balanceOf(ttl2)
    assert(amount == 70, 'TokenTimelock contract for purchaser should be != from 0')
    console.log("TOKEN balanceOf Estimate")
    console.log(await this.token.balanceOf.estimateGas(ttl2,{from: purchaser}))
  })

  it('PREICO Check Tokens in ICO type 1 should be 30 ', async function () {
    var ttl2 = await this.crowdsale.getMyTTLICO( )
    assert(ttl2 == 0, 'TTL address should be 0')
    ttl2 = await this.crowdsale.getMyTTLICO({from: purchaser} )
    assert(ttl2 != 0, 'TTL address should be !=0')
    var amount = await this.token.balanceOf(ttl2)
    assert(amount == 30, 'TokenTimelock contract for purchaser should be != from 0')
  })

  it('PREICO Buy Tokens in pre-ico type 2 as owner should succeed', async function () {
    await this.crowdsale.preICOCompanyReserve( purchaser, 100, 
      ).should.be.fulfilled
    console.log("preICOCompanyReserve Estimate")
    console.log(await this.crowdsale.preICOCompanyReserve.estimateGas(purchaser, 100))
  })

  it('PREICO Check Tokens in type 2 should be 100 ', async function () {
    var ttl2 = await this.crowdsale.getMyTTLType2( )
    assert(ttl2 == 0, 'TTL address should be 0')
    ttl2 = await this.crowdsale.getMyTTLType2({from: purchaser} )
    assert(ttl2 != 0, 'TTL address should be !=0')
    var amount = await this.token.balanceOf(ttl2)
    assert(amount == 100, 'TokenTimelock contract for purchaser should be != from 0')
  })

  it('PREICO Buy Tokens in pre-ico type 3 as owner should succeed', async function () {
    await this.crowdsale.preICOCashback( purchaser, 100, 
      ).should.be.fulfilled
    console.log("preICOCashBack Estimate")
    console.log(await this.crowdsale.preICOCashback.estimateGas(purchaser, 100))
  })

  it('PREICO Check Tokens in type 3 should be 100 ', async function () {
    var ttl2 = await this.crowdsale.getMyTTLType3( )
    assert(ttl2 == 0, 'TTL address should be 0')
    ttl2 = await this.crowdsale.getMyTTLType3({from: purchaser} )
    assert(ttl2 != 0, 'TTL address should be !=0')
    var amount = await this.token.balanceOf(ttl2)
    assert(amount == 100, 'TokenTimelock contract for purchaser should be != from 0')
  })

})
