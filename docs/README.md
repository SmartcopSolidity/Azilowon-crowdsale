# Smartcop Crowdfunding contract features and functionalities

There are two main contracts in this release:

- `Smartcop.sol` is the **Azilowon** (**AWN**) token;
- `Samrtcop_Crowdfund.sol` where all requested features to manage ICO and Pre ICO stages are implemented.

Let's start describing how to deploy the contracts.

## Deployment

**IMPORTANT: the deployment has to be done by a different address from the company wallet one**, since who deploys the contracts is their owner. The company wallet has to receive tokens in Pre ICO stage, and could not if it's also contract's owner.

While the **AWN** does not need configuration parameters since all is known at deployment time, the crowdfunding contract receives these:

1. `kycSigner` is an array Eidoo KYC signer addresses;
2. `wallet` is the address where funds are collected;
3. `startTime` is the time when ICO starts;
4. `endTime` is the time when ICO ends;
5. `rate` is how many token units a buyer gets per wei. The rate is the conversion between wei and the smallest and indivisible token unit. So, if we use a rate of 18000 on **AWN** which has 18 decimals, 1 wei will give 18000 units, or 18000 * 1e-18 **AWN**.
6. `cap` is the cap which has not to be exceeded during ICO. Since the crowdfunding contract is not supposed to control with algorithms the Pre ICO stage, we have intentionally left `cap` as a deployment parameter. It is expressed in wei.

In the deployment, the wallet user must approve the allowance for the whole totalSupply to the crowdfunding contract, in order to let it distribute tokens. Moreover, the user must set the `finalizer` address **as the crowdfunding address**: this will ensure that when the owner (address who deployed the contracts) finalize the ICO, the remaining tokens can be burned.

All this deployment logic is coded in a few lines, as it can be seen in our migration file `4_crowdfund_mock.js`.

## Features and functionalities

Using the deployed crowdfunding contract, they can be managed both Pre ICO and ICO stage, let's see how.

### Pre ICO stage

During the Pre ICO stage, only contract's owner can perform assignment operations.
Following the schema provided, we grouped buyers in three type:

- `Type1` is for _Private Sale_ and _Advisors&Founders_: 30% will be releaseable at the end of the ICO (with `TokenTimeLock`) and 5% releasable every month (with `TokenVesting`) progressively.
- `Type2` is for _Company Reserve_: 6 months locked, then 20% every quarter progressively (with `TokenVesting`)
- `Type3` groups the remaining, _Affiliate Marketing_, _Cashback_, and _Strategic Partners_: 10% every month progressively (with `TokenVesting`)

Each type has its own function to get tokens, namely `preICOassignTokensType1`, `preICOassignTokensType2` and `preICOassignTokensType3`; all these receive in input: `buyerAddress, amount, buyerId, maxAmount, v, r, s`, where the last five parameters are the same as for Eidoo KYC verification.

Any user, at any time, can call the `getMyTTLTypeX` (`X` = {1, 2, 3}) function which will return her `TokenVesting` address which can release her tokens according to the logic provided in the schema.
For users in Type1 group, it can be called the `getMyTTLICO` function to get the `TokenTimeLock` address able to release tokens only at the end of ICO. The release is invoked by any user via the `release` function of `TokenTimeLock` or `TokenVesting` functions.
`Release` functions will fail if not called with correct timings, working accordingly with specifications provided.

### ICO stage

ICO stage is much more standard.
Tokens can be bought via the `buyTokens` functions, providing in input these parameters: `buyerId, maxAmount, v, r, s`; this will perform **KYC verification** thanks to Eidoo engine, and release tokens accordingly.
At the end of ICO it can be called the `finalization` function (only owner can do this): this will only burn remaining tokens.

### Events

Any operation writing on the blockchain emits events stored in the blockchain itself. This events can be retrieved thanks to indexed keys. Let's see in detail:

- `TokenPurchase` event records each purchase operation, and can be retrieved by `purchaser` and/or `beneficiary` address, it stores the wei spent, and token amount as well;
- `PreICOAssign` event stores the amount of tokens assigned to an address, and its type; keys for retrieval are the `purchaser` address, and purchaser `type` (can be 1, 2, 3);
- `Burn` event, stores the owner's address and the amount of tokens burned. It is a one-time-only emitted event, so it has no keys for retrieval. The Burning operation emits also a `Transfer` event, storing the owner address, the beneficiary (which is `account(0)` for burning), and the amount of tokens passed;
- Any standard ERC20 event.