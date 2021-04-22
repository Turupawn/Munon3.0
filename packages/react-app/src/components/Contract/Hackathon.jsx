/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { hexlify } from "@ethersproject/bytes";
import { Row, Col, Input, Divider, Tooltip, Button, List, Radio } from "antd";
import { Transactor } from "../../helpers";
import tryToDisplay from "./utils";
import Blockies from "react-blockies";
import { parseEther, formatEther } from "@ethersproject/units";
import { SyncOutlined } from '@ant-design/icons';
import Blockie from "../Blockie";
import HackathonSponsorship from "./HackathonSponsorship";
const { utils } = require("ethers");
const IPFS = require('ipfs-api');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

const HackathonRegistrationOpen = 0
const HackathonReviewEnabled = 1
const HackathonFinished = 2

export default function Hackathon({ contract, user_provider, id, select_hackathon_function }) {
  const [initializing_triggered, setInitializingTriggered] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [currentCurrentUserIsParticipant, setCurrentUserIsParticipant] = useState("false");
  const [hackathonName, setHackathonName] = useState("");
  const [hackathonImageHash, setHackathonImageHash] = useState("");
  const [hackathonEntryFee, setHackathonEntryFee] = useState(0);
  const [hackathonHostAddress, setHackathonHostAddress] = useState("");
  const [hackathonState, setHackathonState] = useState("");
  const [hackathonPot, setHackathonPot] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [radioButtonRatings, setRadioButtonRatings] = useState([]);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  const initHackathon = async (e) => {
    if(contract && !initializing_triggered)
    {
      console.log("Initializing hackathon...")
      console.log("Really initializing hackathon list...")
      let user_signer = await user_provider.getSigner()
      contract=contract.connect(user_signer)

      let current_signer = await user_provider.getSigner()
      setCurrentAddress(await current_signer.getAddress())
      setInitializingTriggered(true)
      if(currentAddress)
      {
        let hackathon = await contract.hackathons(id)
        setHackathonName(hackathon.name)
        setHackathonImageHash(hackathon.image_hash)
        setHackathonEntryFee(String(parseInt(hackathon.entry_fee._hex)))
        setHackathonHostAddress(hackathon.host_addr)
        setHackathonState(hackathon.state)
        setHackathonPot(String(parseInt(hackathon.pot._hex)))

        setMetrics(await contract.getMetrics(id));

        const participants_count = parseInt(await (await contract.getParticipantCount(id))._hex)
        let participants = []
        let total_points = 0
        for (let i = 0; i < participants_count; i++) {
            const participant_address = await contract.participant_addresses(id, i)

            const participant_points = parseInt(await contract.participant_points(id,participant_address)._hex)

            let reviews = []
            let ratings_sum = 0;
            for (let review_iterator = 0; review_iterator < metrics.length; review_iterator++)
            {
              let rating = parseInt((await contract.participant_ratings(id, currentAddress, participant_address, review_iterator))._hex)
              ratings_sum += rating
              reviews[review_iterator] = rating
            }
            console.log(reviews)

            if(!refreshLoading)
            {
              radioButtonRatings.push(reviews)
            }

            participants.push(
            {
                id: i,
                addr: participant_address,
                points: participant_points,
                current_user_rating: ratings_sum
            })
            total_points += participant_points
        }
        setParticipants(participants)
        setParticipantsLoaded(true)
        setTotalPoints(total_points)

        const participant_has_joined = await contract.participant_has_joined(id, currentAddress)
        setCurrentUserIsParticipant(participant_has_joined)
        
        setRefreshLoading(false)
      }
    }
  }
  initHackathon();

  const handleBackClicked = async () => {
    select_hackathon_function(0)
  }

  const handleRefreshClicked = async () => {
    setRefreshLoading(true)
    setInitializingTriggered(false)
    initHackathon();
  }

  const handleJoinHackathon = async (e) => {
    let user_signer = await user_provider.getSigner()
    contract=contract.connect(user_signer)
    contract.join(id, { value: hackathonEntryFee })
  }

  const handleCashout = async (e) => {
    let user_signer = await user_provider.getSigner()
    contract=contract.connect(user_signer)
    contract.cashOut(id)
  }

  const handleEnableReview = async (e) => {
    let user_signer = await user_provider.getSigner()
    contract=contract.connect(user_signer)
    contract.enableHackathonReview(id)
  }

  const handleFinish = async (e) => {
    let user_signer = await user_provider.getSigner()
    contract=contract.connect(user_signer)
    contract.finishHackathon(id)
  }

  const handleSubmittRating = async (e) => {
    let user_signer = await user_provider.getSigner()
    contract=contract.connect(user_signer)
    console.log(radioButtonRatings)
    contract.rateAll(id, radioButtonRatings)
  };

  const handleRadioButtonClick = (participant_id, metric_id, e) => {
    let radioButtonRatingsTemp = [...radioButtonRatings];
    radioButtonRatings.map((data,index) => {
      if(index == participant_id)
      {
        let temp = radioButtonRatingsTemp[index];
        temp[metric_id] = parseInt(e.target.value);
        radioButtonRatingsTemp[index] = temp;
      }
    });
    setRadioButtonRatings(radioButtonRatingsTemp);
  };

  function currentUserIsHost() { return hackathonHostAddress == currentAddress; }
  function isRegistrationOpen() { return hackathonState == HackathonRegistrationOpen; }
  function isReviewEnabled() { return hackathonState == HackathonReviewEnabled; }
  function isFinished() { return hackathonState == HackathonFinished; }
  function canJoin() { return isRegistrationOpen() && !currentCurrentUserIsParticipant; }
  function canEnableReview() { return isRegistrationOpen() && currentUserIsHost(); }
  function canFinish() { return isReviewEnabled() && currentUserIsHost(); }
  function canCashout() { return isFinished() && currentCurrentUserIsParticipant; }

  function getParticipantDescription(ratings, points)
  {
    let result = ""
    if(isRegistrationOpen())
      return ""
    if(currentCurrentUserIsParticipant)
      result += "You gave this participant " + ratings + " points. "
    result += "Total points: " + points + ". "
    if(totalPoints != 0)
      result += "(" + Math.round(points*100*100/totalPoints)/ 100 + "%)"
    return result
  }

  function renderMetrics(participant)
  {
    return metrics.map((metric, metric_index) =>
      <div>
        <h2>{metric}</h2>
        <Radio.Group onChange={(e) => handleRadioButtonClick(participant.id, metric_index, e)} defaultValue={radioButtonRatings[participant.id][metric_index]}>
                <Radio value={0}>0</Radio>
                <Radio value={1}>1</Radio>
                <Radio value={2}>2</Radio>
                <Radio value={3}>3</Radio>
                <Radio value={4}>4</Radio>
                <Radio value={5}>5</Radio>
              </Radio.Group>
      </div>
    )
  }

  function renderParticipants()
  {
    return <div>
      <h2>Participants</h2>
      <List
      itemLayout="vertical"
      dataSource={participants}
      renderItem={participant => (
        <List.Item>
          <List.Item.Meta
            avatar={<Blockie address={participant.addr} size={8} scale={6} />}
            title={participant.addr}
            description={getParticipantDescription(participant.current_user_rating, participant.points)}
          />
            {currentCurrentUserIsParticipant && isReviewEnabled() &&
            renderMetrics(participant)
          }
        </List.Item>
      )}/>
      {currentCurrentUserIsParticipant && isReviewEnabled() &&
        <Button onClick={(e) => handleSubmittRating(e)}>
          Rate all participants
        </Button>
      }
    </div>
  }

  function renderContract()
  {
    return <div>
      <Button onClick={(e) => handleBackClicked()}>Back</Button>
      <Button onClick={(e) => handleRefreshClicked()}>Refresh</Button>
      {refreshLoading &&
        <div style={{marginTop:8}}>
          <SyncOutlined spin />Refreshing
        </div>
      }
      <Divider />
      <h1>{hackathonName}</h1>
      {isRegistrationOpen() &&
        <p>Registrations Open!</p>
      }
      {isReviewEnabled() &&
        <p>Reviews are now happening</p>
      }
      {isFinished() &&
        <p>This event has finished</p>
      }
      <img width="200" src={"http://ipfs.io/ipfs/" + hackathonImageHash}></img>
      <p>Pot: {formatEther(hackathonPot)} ether</p>
      <p>Entry fee: {formatEther(hackathonEntryFee)} ether</p>
      {canJoin() &&
        <Button onClick={(e) => handleJoinHackathon(e)}>Join Hackathon</Button>
      }
      {canEnableReview() &&
        <Button onClick={(e) => handleEnableReview(e)}>Enable Review</Button>
      }
      {canFinish() &&
        <Button onClick={(e) => handleFinish(e)}>Finish</Button>
      }
      {canCashout() &&
        <Button onClick={(e) => handleCashout(e)}>Cashout</Button>
      }
      {!participantsLoaded &&
        <div style={{marginTop:8}}>
          <SyncOutlined spin />Loading participants
          <Divider />
        </div>
      }
      {participantsLoaded &&
        <div>
          {renderParticipants()}
          <Divider />
        </div>
      }
      <HackathonSponsorship contract={contract} user_provider={user_provider} id={id}/>
    </div>
  }

  return (
    <div>
      {hackathonName == "" &&
        <div style={{marginTop:8}}>
        <SyncOutlined spin />Loading hackathon
      </div>
      }
      {hackathonName != "" &&
        renderContract()
      }
    </div>
  );
}