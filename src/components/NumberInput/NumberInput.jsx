import { useState } from 'react';
import styles from './NumberInput.module.css';

const NumberInput = ({ buttonText, handleClick, step = 1, min = 0 }) => {
  const [number, setNumber] = useState(min);

  return (
    <div className={styles.container}>
      <input
        type="number"
        step={step}
        min={min}
        className={styles.input}
        value={number}
        onChange={(e) => setNumber(Number(e.target.value))}
      />
      <button
        type="button"
        className={styles.button}
        onClick={() => handleClick(number)}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default NumberInput;
