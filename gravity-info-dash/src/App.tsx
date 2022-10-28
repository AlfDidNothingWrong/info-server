import React, { useEffect, useState } from 'react';
import './App.css';
import {
  Spinner,
  CardBody,
  CardTitle,
  Card,
  CardSubtitle,
  Table,
} from "reactstrap";
import { BatchFees, BatchTransaction, ChainTotalSupplyNumbers, Erc20Metadata, EthInfo, GravityInfo, TransactionBatch } from './types';
import { type } from '@testing-library/user-event/dist/type';

// 5 seconds
const UPDATE_TIME = 5000;

const BACKEND_PORT = 9000;
export const SERVER_URL =
  "https://" + window.location.hostname + ":" + BACKEND_PORT + "/";

function App() {
  document.title = "Gravity Bridge Info"
  const [gravityBridgeInfo, setGravityBridgeInfo] = useState<GravityInfo | null>(null);
  const [ethBridgeInfo, setEthBridgeInfo] = useState<EthInfo | null>(null);
  const [supplyInfo, setSupplyInfo] = useState<ChainTotalSupplyNumbers | null>(null);
  const [erc20Metadata, setErc20Metadata] = useState<Array<Erc20Metadata> | null>(null);

  async function getGravityInfo() {
    let request_url = SERVER_URL + "gravity_bridge_info";
    const requestOptions: any = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const result = await fetch(request_url, requestOptions);
    const json = await result.json();
    setGravityBridgeInfo(json)
  }
  async function getEthInfo() {
    let request_url = SERVER_URL + "eth_bridge_info";
    const requestOptions: any = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const result = await fetch(request_url, requestOptions);
    const json = await result.json();
    setEthBridgeInfo(json)
  }
  async function getDistributionInfo() {
    let request_url = SERVER_URL + "supply_info";
    const requestOptions: any = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const result = await fetch(request_url, requestOptions);
    const json = await result.json();
    setSupplyInfo(json)
  }
  async function getErc20Metadata() {
    let request_url = SERVER_URL + "erc20_metadata";
    const requestOptions: any = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const result = await fetch(request_url, requestOptions);
    const json = await result.json();
    setErc20Metadata(json)
  }


  useEffect(() => {
    getDistributionInfo();
    getGravityInfo();
    getEthInfo();
    getErc20Metadata();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      getDistributionInfo();
      getGravityInfo();
      getEthInfo();
      getErc20Metadata();
    }, UPDATE_TIME);
    return () => clearInterval(interval);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gravityBridgeInfo == null || typeof(gravityBridgeInfo) === "string" || ethBridgeInfo == null || supplyInfo == null || typeof(supplyInfo) === "string" || erc20Metadata == null) {
    return (
      <div className="App-header" style={{ display: "flex", flexWrap: "wrap" }}>
        <Spinner
          color="danger"
          type="grow"
        >
          Loading...
        </Spinner>
      </div>
    )
  }

  let bridge_address = gravityBridgeInfo.params.bridge_ethereum_address;
  let etherscanBase = "https://etherscan.io/address/"
  let etherscanBlockBase = "https://etherscan.io/block/"
  let mintscanBase = "https://mintscan.io/gravity-bridge/account/"
  let etherscanLink = etherscanBase + bridge_address;

  return (
    <div className="App-header" style={{ display: "flex", flexWrap: "wrap" }}>
      <div style={{ padding: 5 }}>
        <Card className="ParametersCard" style={{ borderRadius: 8, padding: 20 }}>
          <CardBody>
            <CardTitle tag="h4">
              Transaction Queue
            </CardTitle>
            <CardSubtitle>These transactions are not yet in batches, a batch will be reqested when the fee amount exceeds the cost to execute on Ethereum</CardSubtitle>
            <Table
              style={{ borderSpacing: 20 }}
            >
              <thead>
                <tr>
                  <th>
                    Token
                  </th>
                  <th>
                    Num Transactions
                  </th>
                  <th>
                    Total Fees
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  gravityBridgeInfo.pending_tx.map((batchFees: BatchFees) => (<tr>
                    <td>
                      {getMetadataFromList(batchFees.token, erc20Metadata)?.symbol}
                    </td>
                    <td>
                      {batchFees.tx_count}
                    </td>
                    <td>
                      {amountToFraction(batchFees.token, batchFees.total_fees, erc20Metadata)}
                    </td>

                  </tr>))
                }

              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
      <div style={{ padding: 5 }}>
        <Card className="ParametersCard" style={{ borderRadius: 8, padding: 20 }}>
          <CardBody>
            <CardTitle tag="h4">
              Batch Queue
            </CardTitle>
            <CardSubtitle>These transactions are in batches and waiting to be relayed to Ethereum</CardSubtitle>
            {
              gravityBridgeInfo.pending_batches.map((batch: TransactionBatch) => (<Card>
                <CardBody>
                  <CardTitle tag="h5"> Batch #{batch.nonce}  {getMetadataFromList(batch.token_contract, erc20Metadata)?.symbol}</CardTitle>
                  <div style={{fontSize: 15}}>Total Fees: {amountToFraction(batch.token_contract, batch.total_fee.amount, erc20Metadata)}</div>
                  <div style={{fontSize: 15}}>Timeout: <a href={etherscanBlockBase+batch.batch_timeout}>{batch.batch_timeout}</a></div>
                  <Table
                    style={{ borderSpacing: 10, fontSize: 15 }}
                  >
                    <thead>
                      <tr>
                        <th>
                          To
                        </th>
                        <th>
                          From
                        </th>
                        <th>
                          Amount / Fee
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        batch.transactions.map((batchTx: BatchTransaction) => (<tr>
                          <td>
                            <a href={etherscanBase + batchTx.destination}>{batchTx.destination}</a>
                          </td>
                          <td>
                            <a href={mintscanBase + batchTx.sender}>{batchTx.sender}</a>
                          </td>
                          <td>
                            {amountToFraction(batchTx.erc20_token.contract, batchTx.erc20_token.amount, erc20Metadata)}/
                            {amountToFraction(batchTx.erc20_token.contract, batchTx.erc20_fee.amount, erc20Metadata)}
                          </td>
                        </tr>))
                      }

                    </tbody>
                  </Table>
                </CardBody>
              </Card>))
            }
          </CardBody>
        </Card>
      </div>
      <div style={{ padding: 5 }}>
        <Card className="ParametersCard" style={{ borderRadius: 8, padding: 25 }}>
          <CardBody>
            <CardTitle tag="h4">
              Gravity Supply Info
            </CardTitle>
            <div style={{fontSize: 15}}>Liquid (Not Vesting): {(supplyInfo.total_liquid_supply / 10**12).toFixed(2)}M Graviton</div>
            <div style={{fontSize: 15}}>Liquid (Not Vesting) and staked: {(supplyInfo.total_nonvesting_staked / 10**12).toFixed(2)}M Graviton</div>
            <div style={{fontSize: 15}}>Unclaimed staking rewards: {(supplyInfo.total_unclaimed_rewards / 10**12).toFixed(2)}M Graviton</div>
            <div style={{fontSize: 15}}>Unvested: {(supplyInfo.total_vesting / 10**12).toFixed(2)}M Graviton</div>
            <div style={{fontSize: 15}}>Unvested Staked: {(supplyInfo.total_vesting_staked / 10**12).toFixed(2)}M Graviton</div>
            <div style={{fontSize: 15}}>Vested: {(supplyInfo.total_vested / 10**12).toFixed(2)}M Graviton</div>
          </CardBody>
        </Card>
      </div>
      <div style={{ padding: 5 }}>
        <Card className="ParametersCard" style={{ borderRadius: 8, padding: 25 }}>
          <CardBody>
            <CardTitle tag="h4">
              Current Gravity Parameters
            </CardTitle>
            <div style={{fontSize: 15}}>Ethereum Contract Address: <a href={etherscanLink}>{bridge_address}</a></div>
            <div style={{fontSize: 15}}>Bridge Active: {String(gravityBridgeInfo.params.bridge_active)}</div>
            <div style={{fontSize: 15}}>Target Batch Timeout: {(gravityBridgeInfo.params.target_batch_timeout / 1000) / (60*60)} hours</div>
          </CardBody>
        </Card>
      </div>

    </div >
  );
}

/// Inefficient utility function to lookup token metadata, should be using a map
/// of some kind
function getMetadataFromList(erc20: string, metadata: Array<Erc20Metadata>) {
  var arrayLength = metadata.length;
  for (var i = 0; i < arrayLength; i++) {
    if (metadata[i].address === erc20) {
      return metadata[i]
    }
  }
  return null
}

/// returns a readable fraction value for a given erc20 amount, if the exchange rate is populated
/// it is used to display token value / dollar value
function amountToFraction(erc20: string, amount: number, metadata: Array<Erc20Metadata>) {
  let tokenInfo = getMetadataFromList(erc20, metadata);
  if (tokenInfo == null) {
    return 0
  }
  let fraction = amount / 10 ** tokenInfo.decimals;
  if (tokenInfo.exchange_rate == null) {
    return fraction.toFixed(2);
  } else {
    //let dollar_value = amount / tokenInfo.exchange_rate;
    //return fraction.toFixed(2) + "/ $" + dollar_value.toFixed(2)
    // todo fix backend price
    return fraction.toFixed(2);
  }
}

export default App;