App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold:0,
    tokensAvailable: 750000,
  
    init: function() {
      console.log("App initialized...")
      return App.initWeb3();
    },
  
    initWeb3: function() {
      if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        App.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
      } else {
        // Specify default instance if no web3 instance provided
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        web3 = new Web3(App.web3Provider);
      }
      return App.initContracts();
    },
  
    initContracts: function() {
      $.getJSON("KavaraTokenSale.json", function(KavaraTokenSale) {
        App.contracts.KavaraTokenSale = TruffleContract(KavaraTokenSale);
        App.contracts.KavaraTokenSale.setProvider(App.web3Provider);
        App.contracts.KavaraTokenSale.deployed().then(function(KavaraTokenSale) {
          console.log("Kavara Token Sale Address:", KavaraTokenSale.address);
        });
      }).done(function() {
        $.getJSON("KavaraToken.json", function(KavaraToken) {
          App.contracts.KavaraToken = TruffleContract(KavaraToken);
          App.contracts.KavaraToken.setProvider(App.web3Provider);
          App.contracts.KavaraToken.deployed().then(function(KavaraToken) {
            console.log("Kavara Token Address:", KavaraToken.address);
          });
  
          App.listenForEvents();
          return App.render();
        });
      })
    },

    listenForEvents: function() {
      App.contracts.KavaraTokenSale.deployed().then(function(instance) {
        instance.Sell({}, {
          fromBlock: 0,
          toBlock: 'latest',
        }).watch(function(error, event) {
          console.log("event triggered", event);
          App.render();
        })
      })
    },
  
    render: function() {
      if (App.loading) {
        return;
      }
      App.loading = true;
  
      var loader  = $('#loader');
      var content = $('#content');
  
      loader.show();
      content.hide();
  
      // Load account data
      if(web3.currentProvider.enable){
        //For metamask
        web3.currentProvider.enable().then(function(acc){
            App.account = acc[0];
            $("#accountAddress").html("Your Account: " + App.account);
        });
      } 
      else{
        App.account = web3.eth.accounts[0];
        $("#accountAddress").html("Your Account: " + App.account);
      }
      // Load token sale contract
      App.contracts.KavaraTokenSale.deployed().then(function(instance) {
        KavaraTokenSaleInstance = instance;
        return KavaraTokenSaleInstance.tokenPrice();
      }).then(async function(tokenPrice) {
        App.tokenPrice = tokenPrice;
        $('.token-price').html(await web3.fromWei(App.tokenPrice, "ether").toNumber());
        return KavaraTokenSaleInstance.tokensSold();
      }).then(function(tokensSold) {
        App.tokensSold = tokensSold.toNumber();
        $('.tokens-sold').html(App.tokensSold);
        $('.tokens-available').html(App.tokensAvailable);
        var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
        $('#progress').css('width', progressPercent + '%');
        App.contracts.KavaraToken.deployed().then(function(instance) {
          KavaraTokenInstance = instance;
          return KavaraTokenInstance.balanceOf(App.account);
        }).then(function(balance) {
          $('.Kavara-balance').html(balance.toNumber());
          App.loading = false;
          loader.hide();
          content.show();
        })
      })
      
    },

    buyTokens: function() {
      $('#content').hide();
      $('#loader').show();
      var numberOfTokens = $('#numberOfTokens').val();
      App.contracts.KavaraTokenSale.deployed().then(function(instance) {
        return instance.buyTokens(numberOfTokens, {
          from: App.account,
          value: numberOfTokens * App.tokenPrice,
          gas: 500000 // Gas limit
        });
      }).then(function(result) {
        console.log("Tokens bought...")
        $('form').trigger('reset') // reset number of tokens in form
        // Wait for Sell event
        // check for discord webhook
      });
    }
  }
  $(function() {
    $(window).load(function() {
      App.init();
    })
  });