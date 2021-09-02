const KavaraToken = artifacts.require("KavaraToken");
const KavaraTokenSale = artifacts.require("KavaraTokenSale");

module.exports = function (deployer) {
  deployer.deploy(KavaraToken, 1000000).then(function() {
    // Token price is 0.001 bnb
    var tokenPrice = 1000000000000000;
    return deployer.deploy(KavaraTokenSale, KavaraToken.address, tokenPrice);
  });
};
