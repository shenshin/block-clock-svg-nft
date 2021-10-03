import { useState } from 'react';
import styles from './ColourInputs.module.css';

const toBytes3 = (color = '#00000f') => `0x${color.substring(1)}`;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;
const randomColour = () =>
  `#${[...Array(6).keys()].map(() => randomInt(0, 15).toString(16)).join('')}`;

const ColourInputs = ({ buttonText, handleClick }) => {
  const [bitcoinColour, setBitcoinColour] = useState(randomColour());
  const [rskColour, setRskColour] = useState(randomColour());
  return (
    <div className={styles.container}>
      <div className={styles.colorsContainer}>
        <div>
          <input
            type="color"
            name=""
            id=""
            value={bitcoinColour}
            onChange={(e) => setBitcoinColour(e.target.value)}
          />
          <p>BTC leaf</p>
        </div>
        <div>
          <input
            type="color"
            name=""
            id=""
            value={rskColour}
            onChange={(e) => setRskColour(e.target.value)}
          />
          <p>RSK leaf</p>
        </div>
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={() =>
          handleClick(toBytes3(bitcoinColour), toBytes3(rskColour))
        }
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ColourInputs;
