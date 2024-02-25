## ModeNetwork Swapper (Kim Exchange)
ModeNetwork Swapper is a simple Node.js script for swapping ETH, WETH, USDT, or other ERC20 tokens on Mode Network. It uses the KimRouter Contract for easy exchanges. Using ModeNetwork Swapper helps you earn points for Mode Network's airdrop, giving you a chance to get extra rewards while you trade.  
  
### Features  
1. Swap ETH for WETH and reverse.  
2. Swap ETH for USDT and reverse.  
3. Swap ETH for a custom ERC20 token specified by the user.  
4. Specify the swap pair, amount, custom ERC20 token address, and number of repetitions for the swaps.  
  
### Pre-requisites  
1. Node.js  
2. npm  
3. An Ethereum wallet with some ETH on the Mode network.  
4. A private key to that Ethereum wallet (strongly recommended to use a wallet with a small amount for testing/development purposes and never commit or disclose your private key).  

### Installation  
Clone the repository and install the dependencies:  
```  
git clone git@github.com:bbbwizard/modenet-swapper.git
cd modenet-swapper
npm install
``` 
  
Create a .env file in the root of the project directory containing your personal Ethereum node RPC URL and Private Key:  
```  
RPC_URL='https://mainnet.mode.network' // rpc for the mode network
PRIVATE_KEY='<your_private_key>'
```  
  

### Usage
Run the script with the options to specify the swap pair, amount, and optionally a custom ERC20 token address and the number of repetitions for the swap.  
```  
node index.js --pair eth-weth --amount 0.01 --repeat 1
node index.js --pair eth-usdt --amount 0.01 --repeat 1
node index.js --pair eth-erc20 --token 'erc20_token_address' --amount 'amount' --repeat 1
```  
  
Options:
- `-p, --pair <pair>`: Choose the swap pair, either eth-weth or eth-usdt or specify the custom ERC20 tokens with `-token`.  
- `-a, --amount <amount>`: Specify the amount of ETH that you want to swap.  
- `-t, --token <token>`: (Optional) Specify the ERC20 token address you want to swap with ETH.  
- `-n, --repeat <repeat>`: (Optional) Specify the number of times to repeat the swap operation (default is 1).  

### Warning
Ensure never to expose your private key, especially in a public repository or front-end application.   
Only perform transactions with amounts you are willing to risk, and always double-check smart contract addresses and ABI details before interacting with the contracts.  

### About
Explore the cutting-edge of crypto and Web3 at [CrypJect](https://crypject.xyz) – your hub for the newest projects and resources.  