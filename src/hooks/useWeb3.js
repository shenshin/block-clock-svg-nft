import { useState, useEffect } from 'react';
import getWeb3 from './getWeb3';

const useWeb3 = () => {
  const [web3, setWeb3] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setWeb3(await getWeb3());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return {
    web3,
    error,
    loading,
  };
};

export default useWeb3;
