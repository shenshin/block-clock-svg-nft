const MAP_NETWORK_ID_TO_WS_RPC_URL = new Map();
MAP_NETWORK_ID_TO_WS_RPC_URL.set(30, {
  url: `wss://rsk.getblock.io/mainnet/websocket`,
  options: {
    timeout: 5000, // ms
    headers: {
      'x-api-key': process.env.REACT_APP_GETBLOCK_API_KEY,
    },
  },
});
MAP_NETWORK_ID_TO_WS_RPC_URL.set(31, {
  url: `wss://public-node.testnet.rsk.co/websocket`,
  options: undefined,
});
export default MAP_NETWORK_ID_TO_WS_RPC_URL;
