/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { hexlify } from "@ethersproject/bytes";
import { Row, Col, Input, Divider, Form, Button, Checkbox, Upload } from "antd";
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { Transactor } from "../../helpers";
import tryToDisplay from "./utils";
import Blockies from "react-blockies";
import { parseEther, formatEther } from "@ethersproject/units";
const { utils } = require("ethers");
const IPFS = require('ipfs-api');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

const layout = {
  labelCol: { span: 1 },
  wrapperCol: { span: 23 },
};
const tailLayout = {
  wrapperCol: { offset: 1, span: 23 },
};

export default function HackathonSponsorship({ contract, user_provider, id }) {
  const [hackathonSponsorship, setHackathonSponsorship] = useState("");

  const onHandleSponsorHackathon = async () => {
    if(contract)
    {
      let user_signer = await user_provider.getSigner()
      contract=contract.connect(user_signer)
      let sponsorship_wei = parseEther(hackathonSponsorship)
      contract.sponsor(id, { value: sponsorship_wei } )
    }
  }

  return (
    <div>
      <Row>
        <Col
          span={24}
          style={{
            paddingRight: 6,
            fontSize: 24,
          }}>
          <h4>Sponsor this Hackathon</h4>
          <Form layout="vertical">
            <Form.Item label="Sponsorship (in eth)">
              <Input onChange={(e) => setHackathonSponsorship(e.target.value)} type="text" required={true} placeholder="e.g. 0.3"></Input>
            </Form.Item>
          </Form>
          <Button type="primary" onClick={onHandleSponsorHackathon}>Sponsor Hackathon</Button>
        </Col>
      </Row>
      <Divider />
    </div>
  );
}