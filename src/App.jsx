import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  Link,
  Spinner,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState, useEffect } from 'react';

const { VITE_API_KEY } = import.meta.env;
const ETHERSCAN = `https://etherscan.io/address/`;

function App() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const { ethereum } = window;
  const buttonColor = connected ? "blue" : "red";

  useEffect(() => {
    async function connect() {
      let accounts = await ethereum.request({ method: "eth_requestAccounts" }); 
      setUserAddress(accounts[0]);
    }

    if (connected) connect();

  }, [connected]);

  const handleConnect = async () => {
    if (!connected) {
      try {
        let accounts = await ethereum.request({ 
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }] 
        });
        setConnected(!connected);
      }
      catch (err) {
        console.log(err)
      }
    } 
    else {
      try {
        await ethereum.request({ 
          method: "eth_requestAccounts",
          params: [{ eth_accounts: {} }]
        });
        setConnected(!connected);
        setUserAddress("");
        setHasQueried(false);
        setResults([]);
      }
      catch (err) {
        console.log(err)
      }
    }
  };

  ethereum.on('accountsChanged', (accounts) => {
    console.log(`running handle change`);
    setUserAddress(accounts[0]);
  });

  ethereum.on('chainChanged', (chainId) => {
    // Handle the new chain.
    // Correctly handling chain changes can be complicated.
    // We recommend reloading the page unless you have good reason not to.
    console.log(`chain id changed, reloading window`);
    window.location.reload();
  });

  async function getTokenBalance() {
    setHasQueried(false);
    setResults([]);
    setShowSpinner(true);

    const config = {
      apiKey: VITE_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
  
    const data = await alchemy.core.getTokenBalances(userAddress);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setShowSpinner(false);
    setHasQueried(true);
  }

  function formatBalance(balance, decimals) {
    let resultBal = Utils.formatUnits(balance,decimals);
    let split = resultBal.split(".");
    if (split.length > 1) {
      let formatDecimals = split[1].length > 4 ? split[1].slice(0, 4 ) + '...' : split[1];
      resultBal = formatDecimals.length === 1 ? `${split[0]}` : `${split[0]}.${formatDecimals}`;
    }
    return resultBal;
  }

  let pmsg = connected ? `connected address: ${userAddress}` : `not connected`;

  console.log(pmsg);

  return (
    <Box w="100vw">
      <Flex w="95%" justifyContent="right">
      <Button 
        fontSize={15} 
        onClick={handleConnect} 
        mt={36} 
        bgColor={buttonColor}
      >
          {connected ? "disconnect" : "connect"}
      </Button>
      </Flex>
  
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="0x123....789"
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        {showSpinner && 
          <div>
            <br/>
            <Spinner boxSize={24}/>
          </div>
        }
        
        {hasQueried &&   
          <div>
            <Heading my={36}>ERC-20 token balances:</Heading>

            <SimpleGrid w={'90vw'} columns={4} spacing={24}>
              {results.tokenBalances.map((e, i) => {
                return (
                  <Link href={`${ETHERSCAN}${e.contractAddress}`} isExternal>
                  <Flex
                    flexDir={'column'}
                    color='white'
                    bg='#787D91'
                    w={'20vw'}
                    key={i}
                    p={5}
                    borderRadius='10'
                  >
                    <Box>
                      <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                    </Box>
                    <Box>
                      <b>Balance:</b>&nbsp;
                      {formatBalance(e.tokenBalance,tokenDataObjects[i].decimals) }
                    </Box>
                    <Image 
                      src={
                        tokenDataObjects[i].logo 
                        ? tokenDataObjects[i].logo 
                        : 'https://smart-piggies-403.s3.us-east-2.amazonaws.com/no%20piggy.avif'
                      } 
                      width='25%' 
                    />
                  </Flex>
                  </Link>
                );
              })}
            </SimpleGrid>
          </div>}
      </Flex>
    </Box>
  );
}

export default App;
