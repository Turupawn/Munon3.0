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
  const [currentHackathon, setCurrentHackathon] = useState(0);

  const handleSelectHackathon = async (hackathon_id) => {
    setCurrentHackathon(hackathon_id)
  }

  return (
    <div style={{ margin: "auto", width: "70vw" }}>
      <Card
        title={
          <div>
            {name}
            <div>
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
        { currentHackathon == 0 &&
          <div>
            <HackathonList contract={contract} user_provider={user_provider} select_hackathon_function={handleSelectHackathon} />
            <CreateHackathon contract={contract} user_provider={user_provider}/>
          </div>
        }
        { currentHackathon != 0 &&
          <Hackathon contract={contract} user_provider={user_provider} id={currentHackathon} select_hackathon_function={handleSelectHackathon}/>
        }
      </Card>
    </div>
  );
}
