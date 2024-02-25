const { ethers } = require('ethers');
require('dotenv').config();
const { Command } = require('commander');

// Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Signer - this should be the wallet you wish to swap tokens with
const privateKey = process.env.PRIVATE_KEY;
const signer = new ethers.Wallet(privateKey, provider);

// Address for WETH on Optimism
const WETHAddress = '0x4200000000000000000000000000000000000006'; // Make sure to verify this address
const USDTAddress = '0xf0F161fDA2712DB8b566946122a5af183995e2eD';

// Kim Exchange
// https://app.kim.exchange/swap
const routerAddress = '0x5D61c537393cf21893BE619E36fC94cd73C77DD3';

// You must have the ABI for the WETH contract, or at least for the deposit function
const WETHAbi = [
    "function deposit() payable",
    "function withdraw(uint256 wad)"
];

const Erc20Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint allowance)',
]

// Create a new contract instance for interacting with WETH
const wethContract = new ethers.Contract(WETHAddress, WETHAbi, signer);
let erc20Contract = new ethers.Contract(USDTAddress, Erc20Abi, signer);

async function swapETHforWETH(amount) {
  // Convert the amount to the correct unit (i.e., from Ether to Wei)
  const amountInWei = ethers.parseEther(amount.toString());

  // Call the deposit function of the WETH contract with an ether value
  const tx = await wethContract.deposit({ value: amountInWei });

  // Await the transaction to be mined
  await tx.wait();

  console.log(`Successfully swapped ${amount} ETH for WETH`);
}


async function swapWETHforETH(amount) {
    // Convert the amount to Wei as the contract requires
    const amountInWei = ethers.parseEther(amount.toString());
  
    // Call the withdraw function of the WETH contract
    const tx = await wethContract.withdraw(amountInWei);
  
    // Await for the transaction to be mined
    await tx.wait();
  
    console.log(`Successfully swapped ${amount} WETH for ETH`);
}

const routerAbi = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, address referrer, uint deadline) external payable',
    'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, address referrer, uint deadline) external',
]
const routerContract = new ethers.Contract(routerAddress, routerAbi, signer);

// 0.3%
const slippage = 3

async function checkAndApproveUsdtAllowance(amountToSwap) {
    const signerAddress = await signer.getAddress();
    const currentAllowance = await erc20Contract.allowance(signerAddress, routerAddress);
    console.log(currentAllowance)
    if (currentAllowance < amountToSwap) {
      // Not enough allowance, let's approve
      const tx = await erc20Contract.approve(routerAddress, amountToSwap);
      await tx.wait();
      console.log('ERC20 allowance updated, now we can proceed to swap.');
    } else {
      console.log('ERC20 allowance is sufficient, ready to swap.');
    }
}

async function swapEthforErc20(amount, erc20Address = USDTAddress) {
    const path =[ 
        WETHAddress, // Wrapped ETH (WETH) Address
        erc20Address,  // Token address to swap to
    ];
    const amountsOut = await routerContract.getAmountsOut(ethers.parseEther(amount.toString()), path);
    const amountOut = amountsOut[1];
    console.log(amountOut)
    const amountOutMin = amountOut - (amountOut * BigInt(slippage) / BigInt(1000));
    console.log(amountOutMin)
    const deadline = Math.floor(Date.now() / 1000) + 60; // 60s from now
    const tx = await routerContract.swapExactETHForTokensSupportingFeeOnTransferTokens(
        amountOutMin, // The minimum amount of tokens you want to receive
        path,
        signer.address, // Address to receive the output tokens
        signer.address, // Referrer address
        deadline, // Deadline for the transaction
        { 
          value: ethers.parseEther(amount.toString()), // The amount of ETH you want to swap
        }
    );
    await tx.wait();
    console.log(`Successfully swapped ${amount} ETH for ERC20`);
    return amountOut
}

async function swapErc20forEth(amount, erc20Address = USDTAddress) {
    const balanceAmount = await erc20Contract.balanceOf(signer.address)
    console.log(`token balance: ${balanceAmount}, expect amount: ${amount}`)
    let _amount = amount
    if (amount > balanceAmount) {
        _amount = balanceAmount
    }
    const path =[ 
        erc20Address,  // Token address to swap to
        WETHAddress, // Wrapped ETH (WETH) Address
    ];
    // ethers.parseUnits(amount.toString(), 6)
    const amountsOut = await routerContract.getAmountsOut(_amount, path);
    const amountOut = amountsOut[1];
    console.log(amountOut)
    const amountOutMin = amountOut - (amountOut * BigInt(slippage) / BigInt(1000));
    console.log(amountOutMin)
    const deadline = Math.floor(Date.now() / 1000) + 60; // 60s from now

    await checkAndApproveUsdtAllowance(amountOut);

    const tx = await routerContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amount,
        amountOutMin,
        path,
        signer.address, // Address to receive the output tokens
        signer.address, // Referrer address
        deadline, // Deadline for the transaction
    );
    await tx.wait();
    console.log(`Successfully swapped ${_amount} ERC20 for ETH`);
}

async function swapETHforWETHTask(amount) {
    // Replace '0.1' with the amount of ETH you want to swap for WETH
    await swapETHforWETH(amount)

    // Replace '0.1' with the amount of WETH you want to swap back to ETH
    await swapWETHforETH(amount)
}

async function swapETHforUSDTTask(amount) {
    const usdtAmount = await swapEthforErc20(amount)

    await swapErc20forEth(usdtAmount)
}

// swapETHforWETHTask(0.01)

const program = new Command();

program
  .option('-p, --pair <pair>', 'swap pair either eth-weth or eth-usdt')
  .option('-a, --amount <amount>', 'eth amount')
  .option('-t --token <token>', 'custom erc20 token address')
  .option('-n, --repeat <repeat>', 'number of times to repeat the swap', 1);

program.parse(process.argv);
const options = program.opts();


async function main() {
    const repeat = options.repeat || 1;
    const amount = options.amount;
    if (!amount) throw new Error('amount is undefined');

    if (options.pair === 'eth-weth') {
        for (let i = 0; i < repeat; i++) {
            console.log(`Executing ETH-WETH Swap #${i + 1}`);
            try {
                await swapETHforWETHTask(+amount)
            } catch (e) {
                console.error(e)
            }
        }
    } else if (options.pair === 'eth-usdt') {
        for (let i = 0; i < repeat; i++) {
            console.log(`Executing ETH-USDT Swap #${i + 1}`);
            try {
                await swapETHforUSDTTask(+amount)
            } catch (e) {
                console.error(e)
            }
        }
    } else if (!!options.token) {
        erc20Contract = new ethers.Contract(options.token, Erc20Abi, signer);
        for (let i = 0; i < repeat; i++) {
            console.log(`Executing Custom ERC20 Swap #${i + 1}`);
            try {
                const tokenAmount = await swapEthforErc20(amount, options.token)
                await swapErc20forEth(tokenAmount, options.token)
            } catch (e) {
                console.error(e)
            }
        }
    } else {
        program.help();
    }
}

main()