import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Web3 } from './components/Web3/Web3';

ReactDOM.render(
  <React.StrictMode>
    <Web3>
      <App />
    </Web3>
  </React.StrictMode>,
  document.getElementById('root'),
);
