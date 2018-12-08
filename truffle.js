const ganache = require('ganache-cli')

module.exports = {
  networks: {
    localNode: { // requires a local node (geth/parity) running
      // (net is decided by the node, not necessarily local)
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    localGanache: { // requires a running Ganache GUI open
      host: 'localhost',
      port: 7545,
      network_id: '*'
    },
    development : {
      host: 'localhost', // change with deployed dev blockchain IP
      port: 8545, // change with deployed dev blockchain Port
      network_id: '*' // Match dev blockchain network id
    },
    eidoo : {
      host: 'eidoo-dev-1.bchainapi.net', // change with deployed dev blockchain IP
      port: 8545, // change with deployed dev blockchain Port
      network_id: '*', // Match dev blockchain network id
	  gas: 4700000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
