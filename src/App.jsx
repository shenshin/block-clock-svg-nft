/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import styles from './App.module.css';
import getWeb3 from './hooks/getWeb3';
import BlockClockSvgNft from './contracts/BlockClockSvgNft.json';

const RERENDER_INTERVAL = 30000; // milliseconds

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [appError, setAppError] = useState('');
  const [loading, setLoading] = useState(false);
  // web3 is instantiated once
  useEffect(() => {
    (async () => {
      const newWeb3 = await getWeb3();
      const newAccounts = await newWeb3.eth.getAccounts();
      setWeb3(newWeb3);
      setAccounts(newAccounts);
    })();
  }, []);

  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState(0);
  // contract is instantiated once when web3 is set
  useEffect(() => {
    if (web3) {
      web3.eth.net
        .getId()
        .then((networkId) => {
          if (!BlockClockSvgNft.networks[networkId])
            throw new Error(
              `Contract is not deployed to the network with id ${networkId}`,
            );
          const deployedContract = new web3.eth.Contract(
            BlockClockSvgNft.abi,
            BlockClockSvgNft.networks[networkId].address,
          );
          // listen to contract event
          deployedContract.events.TokenInfo().on('data', (event) => {
            console.log('event is triggering');
            const { _tokenId } = event.returnValues;
            setTokenId(_tokenId);
          });
          setContract(deployedContract);
        })
        .catch((error) => setAppError(error.message));
    }
  }, [web3]);

  // input field values
  const [bitcoinColourInput, setBitcoinColourInput] = useState('#ff0000');
  const [rskColourInput, setRskColourInput] = useState('#00ff08');
  const [tokenIdInput, setTokenIdInput] = useState(0);

  const [rskSvg, setRskSvg] = useState('');
  const [rskBlockNumber, setRskBlockNumber] = useState('?');
  const [btcBlockNumber, setBtcBlockNumber] = useState('?');

  const getBlockNumbers = async () => {
    const { 0: btcBlockNo, 1: rskBlockNo } = await contract.methods
      .getRskBtcBlockNumbers()
      .call();
    setRskBlockNumber(rskBlockNo);
    setBtcBlockNumber(btcBlockNo);
  };

  const getDynamicRskLogo = async () => {
    try {
      setAppError('');
      const logo = await contract?.methods.renderSvgLogo(tokenId).call();
      setRskSvg(logo);
    } catch (err) {
      setAppError(err.message);
    }
  };

  const createToken = async () => {
    try {
      if (!web3) throw new Error('web is not set');
      console.log('sending transaction from: ', accounts[0]);
      // const getBytes = (color) => `0x${color.substr(1)}`;
      setLoading(true);
      await contract.methods
        .create(bitcoinColourInput, rskColourInput)
        .send({ from: accounts[0] });
    } catch (err) {
      setAppError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (contract) {
      getDynamicRskLogo();
      getBlockNumbers();
      interval = setInterval(() => {
        getDynamicRskLogo();
        getBlockNumbers();
      }, RERENDER_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [contract, tokenId]);

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
