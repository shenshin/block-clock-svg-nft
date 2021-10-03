import { useState, createContext } from 'react';
import Web3Lib from 'web3';
import BlockClockSvgNft from '../../contracts/BlockClockSvgNft.json';
import MAP_NETWORK_ID_TO_WS_RPC_URL from './web3Sockets';
import styles from './Web3.module.css';

const WEBSOCKET_RECONNECTION_INTERVAL = 60000; // 1 minute

export const Web3Context = createContext(null);

export function Web3({ children }) {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const enableWeb3 = async () => {
    try {
      setError('');
      if (!window.ethereum) throw new Error('You should enable Metamask');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const myWeb3 = new Web3Lib(window.ethereum);
      setWeb3(myWeb3);
      const myAccounts = await myWeb3.eth.getAccounts();
      setAccounts(myAccounts);
      const networkId = await myWeb3.eth.net.getId();
      if (!BlockClockSvgNft.networks[networkId])
        throw new Error(
          `Contract is not deployed to the network with id ${networkId}`,
        );
      const deployedContract = new myWeb3.eth.Contract(
        BlockClockSvgNft.abi,
        BlockClockSvgNft.networks[networkId].address,
      );
      setContract(deployedContract);

      // ATTACHING 'TokenInfo' EVENT LISTENER
      let lastCall = Date.now();
      const addEventListener = () => {
        let contractWithEvents;
        if ([30, 31].includes(networkId)) {
          const { url, options } = MAP_NETWORK_ID_TO_WS_RPC_URL.get(networkId);
          const wsProvider = new Web3Lib.providers.WebsocketProvider(
            url,
            options,
          );
          const ws = new Web3Lib(wsProvider);
          contractWithEvents = new ws.eth.Contract(
            BlockClockSvgNft.abi,
            BlockClockSvgNft.networks[networkId].address,
          );
        } else {
          contractWithEvents = deployedContract;
        }
        contractWithEvents.events
          .TokenInfo()
          .on('data', (event) => {
            const { _tokenId } = event.returnValues;
            setLoading(`Token ${_tokenId} was created`);
          })
          // keep connection alive
          .on('error', () => {
            if (Date.now() - lastCall > WEBSOCKET_RECONNECTION_INTERVAL) {
              lastCall = Date.now();
              addEventListener();
            } else {
              throw new Error('Event listener detached');
            }
          });
      };
      addEventListener();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      {!web3 ? (
        <button className={styles.button} type="button" onClick={enableWeb3}>
          Enable Web3
        </button>
      ) : (
        <Web3Context.Provider
          value={{
            web3,
            accounts,
            contract,
            error,
            setError,
            loading,
            setLoading,
          }}
        >
          {children}
        </Web3Context.Provider>
      )}
    </div>
  );
}
export default Web3;
