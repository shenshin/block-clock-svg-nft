import { useEffect, useState } from 'react';
import Web3 from 'web3';
import styles from './App.module.css';
import BlockClockSvgNft from './contracts/BlockClockSvgNft.json';

const RERENDER_INTERVAL = 30000; // milliseconds

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState(0);
  const [appError, setAppError] = useState('');
  const [loading, setLoading] = useState(false);

  const enableWeb3 = async () => {
    try {
      setAppError('');
      if (!window.ethereum) throw new Error('You should enable Metamask');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const myWeb3 = new Web3(window.ethereum);
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
      // listen to contract event
      /* deployedContract.events.TokenInfo().on('data', (event) => {
      console.log('event is triggering');
      const { _tokenId } = event.returnValues;
      setTokenId(_tokenId);
    }); */
      setContract(deployedContract);
    } catch (error) {
      setAppError(error.message);
    }
  };

  // input field values
  const [bitcoinColourInput, setBitcoinColourInput] = useState('#ff0000');
  const [rskColourInput, setRskColourInput] = useState('#00ff08');
  const [tokenIdInput, setTokenIdInput] = useState(0);

  // data from the contract
  const [rskSvg, setRskSvg] = useState('');
  const [rskBlockNumber, setRskBlockNumber] = useState('');
  const [btcBlockNumber, setBtcBlockNumber] = useState('');

  const getBlockNumbers = async () => {
    const { 0: btcBlockNo, 1: rskBlockNo } = await contract.methods
      .getRskBtcBlockNumbers()
      .call();
    setRskBlockNumber(rskBlockNo);
    setBtcBlockNumber(btcBlockNo);
  };

  const getDynamicRskLogo = async () => {
    setAppError('');
    const logo = await contract.methods.renderSvgLogo(tokenId).call();
    setRskSvg(logo);
  };

  const createToken = async () => {
    try {
      setAppError('');
      setLoading(true);
      await contract.methods
        .create(bitcoinColourInput, rskColourInput)
        .send({ from: accounts[0] });
    } catch (error) {
      setAppError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (tokenId > 0) {
      (async () => {
        try {
          await getBlockNumbers();
          await getDynamicRskLogo();
          interval = setInterval(async () => {
            try {
              await getDynamicRskLogo();
              await getBlockNumbers();
            } catch (error) {
              setAppError(error.message);
            }
          }, RERENDER_INTERVAL);
        } catch (error) {
          setAppError(error.message);
        }
      })();
    }
    return () => clearInterval(interval);
  }, [tokenId]);

  return (
    <div className={styles.App}>
      {!web3 ? (
        <button
          className={styles.enableWeb3}
          type="button"
          onClick={enableWeb3}
        >
          Enable Web3
        </button>
      ) : (
        <>
          {tokenId !== 0 && (
            <>
              <p>{`Token ID: ${tokenId}`}</p>
              <p>{`RSK block number: ${rskBlockNumber}`}</p>
              <p>{`BTC block number: ${btcBlockNumber}`}</p>
            </>
          )}
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
              <button
                type="button"
                onClick={() => setTokenId(Number(tokenIdInput))}
              >
                Get NTF with ID
              </button>
            </div>
          </div>
          {loading && <h1>Your transaction is being processed</h1>}
          {tokenId !== 0 && (
            <div dangerouslySetInnerHTML={{ __html: rskSvg }} />
          )}
        </>
      )}
      {appError && <h4 className={styles.error}>{appError}</h4>}
    </div>
  );
}

export default App;
