import { useEffect, useState, useContext } from 'react';
import { Web3Context } from './components/Web3/Web3';
import ColourInputs from './components/ColourInputs/ColourInputs';
import NumberInput from './components/NumberInput/NumberInput';
import styles from './App.module.css';

const RERENDER_INTERVAL = 30000; // milliseconds

function App() {
  const { accounts, contract, error, setError, loading, setLoading } =
    useContext(Web3Context);
  const [tokenId, setTokenId] = useState(0);
  const [nftData, setNftData] = useState(null);

  // data from the contract
  const [rskSvg, setRskSvg] = useState('');
  const [rskBlockNumber, setRskBlockNumber] = useState('');
  const [btcBlockNumber, setBtcBlockNumber] = useState('');

  const getBlockNumbers = async () => {
    const result = await contract.methods.getRskBtcBlockNumbers().call();
    setRskBlockNumber(result['1']);
    setBtcBlockNumber(result['0']);
  };

  const getDynamicRskLogo = async () => {
    setError('');
    const logo = String(await contract.methods.renderSvgLogo(tokenId).call());
    if (!(logo.startsWith('<svg') && logo.endsWith('</svg>'))) {
      throw new Error(
        'Received data is not an SVG file and can not be displayed',
      );
    }
    setRskSvg(logo);
  };

  const getNftData = async () =>
    setNftData(await contract.methods.getNftData(tokenId).call());

  const updateContractData = async () => {
    try {
      await getNftData();
      await getBlockNumbers();
      await getDynamicRskLogo();
    } catch (err) {
      setError(err.message);
    }
  };

  const sendTransaction = async (transaction) => {
    try {
      setError('');
      setLoading('Wait, your transaction is being processed');
      await transaction();
      await updateContractData();
    } catch (err) {
      setLoading('');
      setError(
        err.message ??
          'Your transaction was reverted. Check your payment details',
      );
    }
  };

  const createToken = (bitcoinColourInput, rskColourInput) => {
    sendTransaction(async () => {
      await contract.methods
        .create(bitcoinColourInput, rskColourInput)
        .send({ from: accounts[0] });
    });
  };

  const sendLunaTokens = (lunas) => {
    if (tokenId > 0) {
      sendTransaction(async () => {
        if (!nftData?.exists)
          throw new Error('Can not send Lunas to non-existent NFT');
        await contract.methods
          .transferLunas(lunas, tokenId)
          .send({ from: accounts[0] });
        setLoading(`${lunas} Lunas were credited to the NFT#${tokenId}`);
      });
    }
  };

  const changeColours = (changeBitcoinColourInput, changeRskColourInput) => {
    if (tokenId > 0) {
      sendTransaction(async () => {
        if (nftData?.lunasBalance < 100)
          throw new Error('First top up your Lunas balance');
        await contract.methods
          .payLunasForColoursChange(
            tokenId,
            changeBitcoinColourInput,
            changeRskColourInput,
          )
          .send({ from: accounts[0] });
        setLoading('');
      });
    }
  };

  useEffect(() => {
    setLoading('');
    let interval;
    if (tokenId > 0) {
      updateContractData();
      interval = setInterval(() => {
        updateContractData();
      }, RERENDER_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [tokenId]);

  return (
    <>
      <h1>Block-Clock SVG-rendering NFT</h1>
      <div className={styles.container}>
        <div className={styles.info}>
          <h2 className={styles.inputsTitle}>
            Choose leaf colors for your NFT token
          </h2>
          <div className={styles.inputsContainer}>
            <ColourInputs buttonText="Create NFT" handleClick={createToken} />
            <NumberInput buttonText="Get NTF by ID" handleClick={setTokenId} />
            <div>
              <NumberInput
                buttonText="Send Lunas"
                min={100}
                step={100}
                handleClick={sendLunaTokens}
              />
              <p className={styles.clarify}>{`to NFT#${tokenId}`}</p>
            </div>
            <div>
              <ColourInputs
                buttonText="Change colours"
                handleClick={changeColours}
              />
              <p className={styles.clarify}>for 100 Lunas</p>
            </div>
          </div>
          {loading && <h1>{loading}</h1>}
          {error && <h1 className={styles.error}>{error}</h1>}
          {tokenId !== 0 && (
            <>
              <h3 className={styles.nftId}>{`NFT ID: ${tokenId}`}</h3>
              <p>{`NFT Owner: ${
                nftData?.exists ? nftData?.owner : 'non-existent NFT'
              }`}</p>
              <p>{`Luna tokens balance: ${nftData?.lunasBalance ?? '0'}`}</p>
              <p>{`RSK block number: ${rskBlockNumber}`}</p>
              <p>{`BTC block number: ${btcBlockNumber}`}</p>
            </>
          )}
        </div>
        <div>
          {tokenId !== 0 && (
            <div dangerouslySetInnerHTML={{ __html: rskSvg }} />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
