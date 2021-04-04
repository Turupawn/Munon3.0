/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { hexlify } from "@ethersproject/bytes";
import { Row, Col, Input, Divider, Tooltip, Button } from "antd";
import { Transactor } from "../../helpers";
import tryToDisplay from "./utils";
import Blockies from "react-blockies";
import { SyncOutlined } from '@ant-design/icons';
const { utils } = require("ethers");
const IPFS = require('ipfs-api');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});


export default function HackathonList({ contract, user_provider, select_hackathon_function }) {
  const [initializing_triggered, setInitializingTriggered] = useState(false);
  const [hackathons, setHackathons] = useState([]);

  const initHackathonList = async (e) => {
    console.log("Initializing...")
    if(contract && !initializing_triggered)
    {
      setInitializingTriggered(true)
      console.log("Really initializing hackathon list...")
      const hackathon_count = parseInt((await contract.hackathon_count())._hex)
      let hackathons = []
      for (let i = hackathon_count; i >= 1; i--) {
        const hackathon = await contract.hackathons(i)
        hackathons.push(
          {
            id: i,
            name: hackathon.name,
            image_hash: hackathon.image_hash,
            host_addr: hackathon.host_addr,
            state: hackathon.state,
            pot: parseInt(hackathon.pot._hex)
          })
      }
      setHackathons(hackathons)
    }
  }
  initHackathonList()

  const handleSelectHackathonClicked = async (id) => {
    select_hackathon_function(id)
  }

  function HackathonListElement(id, name, image_hash) {
    return <div style={{ margin: 2 }} key={id}>
      <h2>{name}</h2>
      <img width="200" src={"http://ipfs.io/ipfs/" + image_hash}></img><br/>
      <Button onClick={(e) => handleSelectHackathonClicked(id)}>Go to hackathon</Button>
      <Divider />
    </div>;
  }

  return <div>
      {hackathons.length == 0 &&
        <div style={{marginTop:8}}>
          <SyncOutlined spin />Loading hackathons
          <Divider />
        </div>
      }
      {hackathons.length != 0 &&
        (hackathons.map(function(hackathon) {
          return HackathonListElement(hackathon.id, hackathon.name, hackathon.image_hash);
        }))
      }
    </div>
}