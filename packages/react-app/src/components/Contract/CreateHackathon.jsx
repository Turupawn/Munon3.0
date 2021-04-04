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
const { utils } = require("ethers");
const IPFS = require('ipfs-api');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});


export default function CreateHackathon({ contract, user_provider }) {
  const [hackathonName, setHackathonName] = useState("");
  const [hackathonEntryFee, setHackathonEntryFee] = useState("");
  const [image_buffer, setImageBuffer] = useState(null);

  const handleCreateHackathon = async (e) => {
    e.preventDefault()
    if(contract)
    {
      let user_signer = await user_provider.getSigner()
      contract=contract.connect(user_signer)
      await ipfs.files.add(image_buffer, (error, result) => {
        if(error) {
          console.log(error);
          return;
        }  

        let ipfs_image_hash = result[0].hash
        console.log(ipfs_image_hash)
        let entry_fee_wei = String(parseFloat(hackathonEntryFee)*1000000000000000000)
        console.log(entry_fee_wei)
        contract.createHackathon(hackathonName, ipfs_image_hash, BigNumber.from(entry_fee_wei))
      });
    }
  }

  const handleImageChange = async (e) => {
    e.preventDefault()
    const file = e.target.files[0]
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
        setImageBuffer(Buffer.from(reader.result))
    }
  }

  return (
    <div>
      <Row>
        <Col
          span={24}
          style={{
            opacity: 0.333,
            paddingRight: 6,
            fontSize: 24,
          }}>
          <h2>Create a new Hackathon</h2>
          <Input onChange={(e) => setHackathonName(e.target.value)} type="text" required={true} placeholder="e.g. My hackathon"></Input>
          <Input onChange={(e) => setHackathonEntryFee(e.target.value)} type="text" required={true} placeholder="e.g. 0.3"></Input>
          <input key="file_upload" type="file" required={true} onChange={(e) => handleImageChange(e)} />
          <Button onClick={(e) => handleCreateHackathon(e)}>Create Hackathon</Button>
        </Col>
      </Row>
      <Divider />
    </div>
  );
}