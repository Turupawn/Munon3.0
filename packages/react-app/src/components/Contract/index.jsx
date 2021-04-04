import React, { useMemo, useState } from "react";
import { useParams } from 'react-router-dom';
import { Card } from "antd";
import { useContractLoader, useContractExistsAtAddress } from "../../hooks";
import Account from "../Account";
import DisplayVariable from "./DisplayVariable";
import FunctionForm from "./FunctionForm";
import { Row, Col, Input, Divider, Tooltip, Button } from "antd";
import CreateHackathon from "./CreateHackathon";
import Hackathon from "./Hackathon";
import HackathonList from "./HackathonList";

const isQueryable = fn => (fn.stateMutability === "view" || fn.stateMutability === "pure") && fn.inputs.length === 0;

export default function Contract({ customContract, account, gasPrice, user_provider, signer, provider, name, show, price, blockExplorer, current_view }) {

  const contracts = useContractLoader(provider);
  let contract
  if(!customContract){
    contract = contracts ? contracts[name] : "";
  }else{
    contract = customContract
  }

  let {id} = useParams();
  const address = contract ? contract.address : "";
  const contractIsDeployed = useContractExistsAtAddress(provider, address);
  const [contract_loaded, setContractLoaded] = useState(false);

  return (
    <div style={{ margin: "auto", width: "70vw" }}>
      <Card
        title={
          <div>
            {name}
            <div style={{ float: "right" }}>
              <Account
                address={address}
                localProvider={provider}
                injectedProvider={provider}
                mainnetProvider={provider}
                price={price}
                blockExplorer={blockExplorer}
              />
              {account}
            </div>
          </div>
        }
        size="large"
        style={{ marginTop: 25, width: "100%" }}
        loading={!contractIsDeployed}
      >
        { current_view == "home" &&
          <div>
            <HackathonList contract={contract} user_provider={user_provider}/>
            <CreateHackathon contract={contract} user_provider={user_provider}/>
          </div>
        }
        { current_view == "hackathon" &&
          <Hackathon contract={contract} user_provider={user_provider} id={id}/>
        }
      </Card>
    </div>
  );
}
