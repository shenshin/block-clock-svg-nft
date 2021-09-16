/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import useContract from './hooks/useContact';
import styles from './App.module.css';
import BlockClockSvgNft from './contracts/BlockClockSvgNft.json';

const RERENDER_INTERVAL = 30000; // milliseconds

function App() {
  const { contract, web3, contractError } = useContract(BlockClockSvgNft);

  // input field values
  const [bitcoinColourInput, setBitcoinColourInput] = useState('#ff0000');
  const [rskColourInput, setRskColourInput] = useState('#00ff08');
  const [tokenIdInput, setTokenIdInput] = useState(0);

  const [tokenId, setTokenId] = useState(0);
  const [rskSvg, setRskSvg] = useState('');
  const [rskBlockNumber, setRskBlockNumber] = useState('?');
  const [btcBlockNumber, setBtcBlockNumber] = useState('?');

  const [loading, setLoading] = useState(false);
  const [appError, setAppError] = useState('');

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

  const listenToTokenInfoEvent = () => {
    contract.events.TokenInfo().on('data', async (event) => {
      try {
        console.log('event is triggering');
        const { _tokenId } = event.returnValues;
        setTokenId(_tokenId);
      } catch (err) {
        setAppError(err.message);
      }
    });
  };

  const createToken = async () => {
    try {
      const [from] = await web3.eth.getAccounts();
      console.log('sending transaction from: ', from);
      // const getBytes = (color) => `0x${color.substr(1)}`;
      setLoading(true);
      await contract.methods
        .create(bitcoinColourInput, rskColourInput)
        .send({ from });
    } catch (err) {
      setAppError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (web3 && contract) {
      getDynamicRskLogo();
      getBlockNumbers();
      interval = setInterval(() => {
        getDynamicRskLogo();
        getBlockNumbers();
      }, RERENDER_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [web3, contract, tokenId]);

  useEffect(() => {
    if (web3 && contract) listenToTokenInfoEvent();
  }, [web3, contract]);

  return contractError ? (
    <h3 className={styles.error}>{contractError}</h3>
  ) : (
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
