import { useEffect, useState, useCallback } from 'react';
import Web3 from 'web3';
import styles from './App.module.css';
import BlockClockSvgNft from './contracts/BlockClockSvgNft.json';

const RERENDER_INTERVAL = 30000; // milliseconds

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [appError, setAppError] = useState('');
  const [loading, setLoading] = useState(false);

  const getMyWeb3 = useCallback(async () => {
    if (web3) return web3;
    if (!window.ethereum) throw new Error('You should enable Metamask');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const myWeb3 = new Web3(window.ethereum);
    setWeb3(myWeb3);
    return myWeb3;
  }, [web3]);
  const getMyAccounts = useCallback(async () => {
    if (accounts) return accounts;
    const myWeb3 = await getMyWeb3();
    const myAccounts = await myWeb3.eth.getAccounts();
    setAccounts(myAccounts);
    return myAccounts;
  }, [web3, accounts]);

  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState(0);

  const getMyContract = useCallback(async () => {
    if (contract) return contract;
    const myWeb3 = await getMyWeb3();
    const networkId = await myWeb3.eth.net.getId();
    if (!BlockClockSvgNft.networks[networkId])
      throw new Error(
        `Contract is not deployed to the network with id ${networkId}`,
      );
    const deployedContract = new myWeb3.eth.Contract(
      BlockClockSvgNft.abi,
      BlockClockSvgNft.networks[networkId].address,
    );
    // listen to contract event
    /* deployedContract.events.TokenInfo().on('data', (event) => {
      console.log('event is triggering');
      const { _tokenId } = event.returnValues;
      setTokenId(_tokenId);
    }); */
    setContract(deployedContract);
    return deployedContract;
  }, [web3, contract]);

  // input field values
  const [bitcoinColourInput, setBitcoinColourInput] = useState('#ff0000');
  const [rskColourInput, setRskColourInput] = useState('#00ff08');
  const [tokenIdInput, setTokenIdInput] = useState(0);

  // data from the contract
  const [rskSvg, setRskSvg] = useState('');
  const [rskBlockNumber, setRskBlockNumber] = useState('?');
  const [btcBlockNumber, setBtcBlockNumber] = useState('?');

  const getBlockNumbers = useCallback(async () => {
    try {
      const myContract = await getMyContract();
      const { 0: btcBlockNo, 1: rskBlockNo } = await myContract.methods
        .getRskBtcBlockNumbers()
        .call();
      setRskBlockNumber(rskBlockNo);
      setBtcBlockNumber(btcBlockNo);
    } catch (error) {
      setAppError(error.message);
    }
  }, [contract]);

  const getDynamicRskLogo = useCallback(async () => {
    try {
      setAppError('');
      const myContract = await getMyContract();
      const logo = await myContract.methods.renderSvgLogo(tokenId).call();
      setRskSvg(logo);
    } catch (error) {
      setAppError(error.message);
    }
  }, [contract, tokenId]);

  const createToken = useCallback(async () => {
    try {
      setAppError('');
      const myAccounts = await getMyAccounts();
      const myContract = await getMyContract();
      setLoading(true);
      await myContract.methods
        .create(bitcoinColourInput, rskColourInput)
        .send({ from: myAccounts[0] });
    } catch (error) {
      setAppError(error.message);
    } finally {
      setLoading(false);
    }
  }, [contract, accounts]);

  useEffect(() => {
    let interval;
    if (tokenId > 0) {
      getBlockNumbers();
      getDynamicRskLogo();
      interval = setInterval(() => {
        getDynamicRskLogo();
        getBlockNumbers();
      }, RERENDER_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [tokenId, contract]);

  return (
    <div className={styles.App}>
      <p>{`Token ID: ${tokenId}`}</p>
      <p>{`RSK block number: ${rskBlockNumber}`}</p>
      <p>{`BTC block number: ${btcBlockNumber}`}</p>
      <h3>Choose leaf colors for your NFT token</h3>
      <div className={styles.centeredDiv}>
        <div>
          <div className={styles.centeredDiv}>
            <div>
              <input
                type="color"
                name=""
                id=""
                value={bitcoinColourInput}
                onChange={(e) => setBitcoinColourInput(e.target.value)}
              />
              <p>BTC leaf</p>
            </div>
            <div>
              <input
                type="color"
                name=""
                id=""
                value={rskColourInput}
                onChange={(e) => setRskColourInput(e.target.value)}
              />
              <p>RSK leaf</p>
            </div>
          </div>
          <button type="button" onClick={createToken}>
            Create NFT with above colors
          </button>
        </div>
        <div className={`${styles.centeredDiv} ${styles.horizontal}`}>
          <input
            type="number"
            step="1"
            min="0"
            style={{ width: '3rem' }}
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
          />
          <button type="button" onClick={() => setTokenId(tokenIdInput)}>
            Get NTF with ID
          </button>
        </div>
      </div>

      {appError && <h4 className={styles.error}>{appError}</h4>}
      {loading && <h1>Your transaction is being processed</h1>}
      {rskSvg && <div dangerouslySetInnerHTML={{ __html: rskSvg }} />}
    </div>
  );
}

export default App;
