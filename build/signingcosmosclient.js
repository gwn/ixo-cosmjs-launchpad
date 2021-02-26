"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigningCosmosClient = void 0;
const cosmosclient_1 = require("./cosmosclient");
const encoding_1 = require("./encoding");
const gas_1 = require("./gas");
const lcdapi_1 = require("./lcdapi");
const tx_1 = require("./tx");
const defaultGasPrice = gas_1.GasPrice.fromString("0.025ucosm");
const defaultGasLimits = { send: 80000 };
class SigningCosmosClient extends cosmosclient_1.CosmosClient {
    /**
     * Creates a new client with signing capability to interact with a Cosmos SDK blockchain. This is the bigger brother of CosmosClient.
     *
     * This instance does a lot of caching. In order to benefit from that you should try to use one instance
     * for the lifetime of your application. When switching backends, a new instance must be created.
     *
     * @param apiUrl The URL of a Cosmos SDK light client daemon API (sometimes called REST server or REST API)
     * @param senderAddress The address that will sign and send transactions using this instance
     * @param signer An implementation of OfflineSigner which can provide signatures for transactions, potentially requiring user input.
     * @param gasPrice The price paid per unit of gas
     * @param gasLimits Custom overrides for gas limits related to specific transaction types
     * @param broadcastMode Defines at which point of the transaction processing the broadcastTx method returns
     */
    constructor(apiUrl, senderAddress, signer, gasPrice = defaultGasPrice, gasLimits = {}, broadcastMode = lcdapi_1.BroadcastMode.Block) {
        super(apiUrl, broadcastMode);
        this.anyValidAddress = senderAddress;
        this.senderAddress = senderAddress;
        this.signer = signer;
        this.fees = gas_1.buildFeeTable(gasPrice, defaultGasLimits, gasLimits);
    }
    async getSequence(address) {
        return super.getSequence(address || this.senderAddress);
    }
    async getAccount(address) {
        return super.getAccount(address || this.senderAddress);
    }
    async sendTokens(recipientAddress, transferAmount, memo = "") {
        const sendMsg = {
            type: "cosmos-sdk/MsgSend",
            value: {
                from_address: this.senderAddress,
                to_address: recipientAddress,
                amount: transferAmount,
            },
        };
        return this.signAndBroadcast([sendMsg], this.fees.send, memo);
    }
    /**
     * Gets account number and sequence from the API, creates a sign doc,
     * creates a single signature, assembles the signed transaction and broadcasts it.
     */
    async signAndBroadcast(msgs, fee, memo = "") {
        const { accountNumber, sequence } = await this.getSequence();
        const chainId = await this.getChainId();
        const signDoc = encoding_1.makeSignDoc(msgs, fee, chainId, memo, accountNumber, sequence);
        const { signed, signature } = await this.signer.sign(this.senderAddress, signDoc);
        const signedTx = tx_1.makeStdTx(signed, signature);
        return this.broadcastTx(signedTx);
    }
}
exports.SigningCosmosClient = SigningCosmosClient;
//# sourceMappingURL=signingcosmosclient.js.map