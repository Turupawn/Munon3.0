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

export default function CreateHackathon({ contract, user_provider }) {
  const [hackathonName, setHackathonName] = useState("");
  const [hackathonEntryFee, setHackathonEntryFee] = useState("");
  const [image_buffer, setImageBuffer] = useState(null);

  const onHandleCreateHackathon = async () => {
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
        let entry_fee_wei = parseEther(hackathonEntryFee)
        contract.createHackathon(hackathonName, ipfs_image_hash, BigNumber.from(entry_fee_wei))
      });
    }
  }

  const normFile = (e) => {
    if (Array.isArray(e.fileList)) {
      const file = e.fileList[0].originFileObj
      const reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => {
        setImageBuffer(Buffer.from(reader.result))
      }
    }
    return null;
  };

  return (
    <div>
      <Row>
        <Col
          span={24}
          style={{
            paddingRight: 6,
            fontSize: 24,
          }}>
          <h4>Create new Hackathon</h4>
          <Form layout="vertical">
            <Form.Item label="Name">
              <Input onChange={(e) => setHackathonName(e.target.value)} type="text" required={true} placeholder="e.g. My hackathon"></Input>
            </Form.Item>
            <Form.Item label="Entry fee (in eth)">
              <Input onChange={(e) => setHackathonEntryFee(e.target.value)} type="text" required={true} placeholder="e.g. 0.3"></Input>
            </Form.Item>
            <Form.Item
              name="upload"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              extra="upload a small hackathon poster (400x200 px)"
              >
              <Upload name="logo" action="#" listType="picture">
                <Button icon={<UploadOutlined />}>Click to upload</Button>
              </Upload>
            </Form.Item>
          </Form>
          <Button type="primary" onClick={onHandleCreateHackathon}>Create Hackathon</Button>
        </Col>
      </Row>
      <Divider />
    </div>
  );
}