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

const HackathonRegistrationOpen = 0
const HackathonReviewEnabled = 1
const HackathonFinished = 2

export default function Hackathon({ contract, user_provider, id }) {
  const [initializing_triggered, setInitializingTriggered] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [currentCurrentUserIsParticipant, setCurrentUserIsParticipant] = useState("false");
  const [hackathonName, setHackathonName] = useState("");
  const [hackathonImageHash, setHackathonImageHash] = useState("");
  const [hackathonEntryFee, setHackathonEntryFee] = useState("");
  const [hackathonHostAddress, setHackathonHostAddress] = useState("");
  const [hackathonState, setHackathonState] = useState("");
  const [hackathonPot, setHackathonPot] = useState("");
  const [participants, setParticipants] = useState([]);
  const [radioButtonRatings, setRadioButtonRatings] = useState([]);

  const initHackathon = async (e) => {
    if(contract && !initializing_triggered)
    {
      console.log("Initializing...")
      let current_signer = await user_provider.getSigner()
      setCurrentAddress(await current_signer.getAddress())
      setInitializingTriggered(true)
      if(currentAddress)
      {
        let hackathon = await contract.hackathons(id)
        console.log(hackathon)
        setHackathonName(hackathon.name)
        setHackathonImageHash(hackathon.image_hash)
        setHackathonEntryFee(parseInt(hackathon.entry_fee._hex))
        setHackathonHostAddress(hackathon.host_addr)
        setHackathonState(hackathon.state)
        setHackathonPot(parseInt(hackathon.pot._hex))

        const participants_count = parseInt(await (await contract.getParticipantCount(id))._hex)
        let participants = []
        for (let i = 0; i < participants_count; i++) {
            const participant_address = await contract.hackathon_participant_addresses(id, i)
            const participant = await contract.hackathon_participants(id,participant_address)
            const current_user_participant_rating = parseInt((await contract.participant_ratings(id, currentAddress, participant_address))._hex)
            participants.push(
            {
                id: i,
                addr: participant.addr,
                points: parseInt(participant.points._hex),
                current_user_rating: current_user_participant_rating
            })
            radioButtonRatings.push(current_user_participant_rating)
        }
        setParticipants(participants)

        const current_user_participation = await contract.hackathon_participants(id, currentAddress)
        if (parseInt(current_user_participation.addr) != 0)
          setCurrentUserIsParticipant(true)
        else
          setCurrentUserIsParticipant(false)
      }
    }
  }

  const handleJoinHackathon = async (e) => {
    let user_signer = await user_provider.getSigner()
    contract=contract.connect(user_signer)
    contract.join(id, { value: BigNumber.from(String(hackathonEntryFee)) })
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

  const handleSubmittRating = async (participant_id, participant_address, e) => {
    //const tx = await hackathon_munon.instance.rate(id, participant_address, radio_button_ratings[participant_id])
    let user_signer = await user_provider.getSigner()
    contract=contract.connect(user_signer)
    contract.rate(id, participant_address, radioButtonRatings[participant_id])
  };

  const handleRadioButtonClick = (participant_id, e) => {
    let radioButtonRatingsTemp = [...radioButtonRatings];
    radioButtonRatings.map((data,index) => {
      if(index == participant_id)
      radioButtonRatingsTemp[index] = parseInt(e.target.value);
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

  initHackathon();

  return (
<div>
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
    <p>Pot: {hackathonPot}</p>
    <p>Entry fee: {hackathonEntryFee}</p>
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
    <ul>
    <h2>Participants</h2>
    {participants.map(function(participant) {
        return <li key={ participant.addr }>
            { participant.addr } 
            {isReviewEnabled() &&
                <div>
                    <div>
                      <input type="radio"
                        label="0"
                        my={2}
                        value={0}
                        checked={radioButtonRatings[participant.id] === 0}
                        onChange={(e) => handleRadioButtonClick(participant.id, e)}
                        />
                        <input type="radio"
                        label="1"
                        my={2}
                        value={1}
                        checked={radioButtonRatings[participant.id] === 1}
                        onChange={(e) => handleRadioButtonClick(participant.id, e)}
                        />
                        <input type="radio"
                        label="2"
                        my={2}
                        value={2}
                        checked={radioButtonRatings[participant.id] === 2}
                        onChange={(e) => handleRadioButtonClick(participant.id, e)}
                        />
                        <input type="radio"
                        label="3"
                        my={2}
                        value={3}
                        checked={radioButtonRatings[participant.id] === 3}
                        onChange={(e) => handleRadioButtonClick(participant.id, e)}
                        />
                        <input type="radio"
                        label="4"
                        my={2}
                        value={4}
                        checked={radioButtonRatings[participant.id] === 4}
                        onChange={(e) => handleRadioButtonClick(participant.id, e)}
                        />
                        <input type="radio"
                        label="5"
                        my={2}
                        value={5}
                        checked={radioButtonRatings[participant.id] === 5}
                        onChange={(e) => handleRadioButtonClick(participant.id, e)}
                        />
                    </div>
                    <div>
                        <Button onClick={(e) => handleSubmittRating(participant.id, participant.addr, e)}>
                            Rate
                        </Button>
                    </div>
                </div>
            }
        </li>;
    })}
    </ul>
</div>
  );
}