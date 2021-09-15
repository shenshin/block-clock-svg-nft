import { useEffect, useState } from 'react';
import useWeb3 from './useWeb3';

const useContract = (contractApi) => {
  const { web3, error: web3Error } = useWeb3();
  const [contract, setContract] = useState(null);
  const [contractError, setContractError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        // rethrow web3 error
        if (web3Error) throw new Error(web3Error);
        if (!(typeof contractApi === 'object' && contractApi !== null))
          throw new Error('Invalid JSON API');
        if (web3) {
          const networkId = await web3.eth.net.getId();
          if (!contractApi.networks[networkId])
            throw new Error(
              `Contract is not deployed to the network with id ${networkId}`,
            );
          const deployedContract = new web3.eth.Contract(
            contractApi.abi,
            contractApi.networks[networkId].address,
          );
          setContract(deployedContract);
        }
      } catch (error) {
        setContractError(error.message);
      }
    })();
  }, [web3]);
  return {
    contract,
    error: contractError,
  };
};

export default useContract;
