let bip39 = require("bip39");
let chalk = require("chalk");
require("dotenv").config();
let {
  DirectSecp256k1HdWallet,
  OfflineSigner,
  DirectSecp256k1Wallet,
} = require("@cosmjs/proto-signing");
let {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
  GasPrice,
  coins,
} = require("@cosmjs/stargate");
let fs = require("fs");

async function createReceiveAddress() {
  const mnemonic = bip39.generateMnemonic();
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "warden",
  });
  const [firstAccount] = await wallet.getAccounts();

  return firstAccount.address;
}

async function sendTransaction(wallet, recipient) {
  try {
    const rpcEndpoint = "https://rpc.buenavista.wardenprotocol.org";
    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      wallet,
      {
        gasPrice: GasPrice.fromString("0.0052uward"),
      }
    );

    const amount = coins(100, "uward");
    const [firstAccount] = await wallet.getAccounts();
    console.log(
      chalk.yellow("Send"),
      chalk.green("0.0001 $WARD"),
      chalk.yellow("from"),
      chalk.gray(firstAccount.address),
      chalk.yellow("to"),
      chalk.gray(recipient)
    );

    const transaction = await client.sendTokens(
      firstAccount.address,
      recipient,
      amount,
      "auto"
    );
    assertIsDeliverTxSuccess(transaction);

    console.log(
      chalk.bold(chalk.green("Successfully broadcasted:")),
      chalk.gray(transaction.transactionHash)
    );
  } catch (err) {
    console.log(err.message);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let number = 0;
async function createRecipentAddress() {
  while (number < 150) {
    let wallet = await createReceiveAddress();
    fs.appendFileSync("./address.txt", `${wallet}\n`, "utf-8");
    console.log(`Wallet address disimpan di address.txt`);
    number += 1;
  }
}

(async () => {
  let path = fs.existsSync("./address.txt");
  if (path) {
    let pathAddress = fs.readFileSync("./address.txt");
    let addressList = pathAddress.toString().split("\n");
    for (let i = 0; i < addressList.length; i++) {
      try {
        let address = addressList[i];
        //privateKey
        let wallet = await DirectSecp256k1Wallet.fromKey(
          Buffer.from("privateKey", "hex"),
          "warden"
        );
        //mnemonic
        const wallets = await DirectSecp256k1HdWallet.fromMnemonic("mnemonic", {
          prefix: "warden",
        });
        await sendTransaction(wallets, address);
        console.log(chalk.yellow("Sleeping for 50 seconds..."));
        await sleep(50000);
      } catch (err) {
        console.log(err.message);
      }
    }
  } else {
    await createRecipentAddress();
  }
})();
