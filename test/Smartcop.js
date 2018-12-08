var smartcop = artifacts.require('../contracts/Smartcop.sol')

contract('Smartcop', function (accounts) {
  it('should put 1e27 scTok in the first account', async function () {
    const instance = await smartcop.deployed()
    const balance = await instance.balanceOf(accounts[0])
    assert.equal(balance.valueOf(), 1e27, '1e27 wasn\'t in the first account')
  })

  it('should send coin correctly', async function () {
    // Get initial balances of first and second account.
    const accountOne = accounts[0]
    const accountTwo = accounts[1]

    const amount = 10

    const instance = await smartcop.deployed()
    let accountOneStartingBalance = await instance.balanceOf(accountOne)
    accountOneStartingBalance = accountOneStartingBalance.toNumber()
    let accountTwoStartingBalance = await instance.balanceOf(accountTwo)
    accountTwoStartingBalance = accountTwoStartingBalance.toNumber()

    await instance.transfer(accountTwo, amount, { from: accountOne })

    let accountOneEndingBalance = await instance.balanceOf(accountOne)
    accountOneEndingBalance = accountOneEndingBalance.toNumber()
    let accountTwoEndingBalance = await instance.balanceOf(accountTwo)
    accountTwoEndingBalance = accountTwoEndingBalance.toNumber()

    assert.equal(accountOneEndingBalance,
      accountOneStartingBalance - amount,
      'Amount wasn\'t correctly taken from the sender')
    assert.equal(accountTwoEndingBalance,
      accountTwoStartingBalance + amount,
      'Amount wasn\'t correctly sent to the receiver')
  })
})
