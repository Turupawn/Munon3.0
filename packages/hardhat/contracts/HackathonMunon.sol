pragma solidity ^0.8.0;

import "contracts/SafeMath.sol";

contract HackathonMunon
{
  // Events
  event HackathonCreation
  (
    address hackaton_host,
    uint256 hackathon_id,
    string name,
    string image_hash,
    uint256 entry_fee,
    uint256 creation_time
  );

  event Registration
  (
    uint256 hackathon_id,
    address participant_addr
  );

  event SponsorshipSubmited
  (
    uint256 hackathon_id,
    uint256 value
  );

  event RateAllSubmited
  (
    uint256 hackathon_id,
    address reviewer_addr,
    uint256[] points
  );

  event CashOut
  (
    uint256 hackathon_id,
    address participant_addr,
    uint256 reward
  );

  event HackathonReviewEnabled
  (
    uint256 hackathon_id
  );

  event HackathonFinished
  (
    uint256 hackathon_id
  );

  using SafeMath for uint256;
  // Structs
  struct Hackathon
  {
    address host_addr;
    HackathonState state;
    string name;
    string image_hash;
    uint256 entry_fee;
    uint256 pot;
    uint256 creation_time;
    uint256 enable_review_time;
  }

  struct Participant
  {
    address addr;
    uint256 points;
  }

  // Enums
  enum HackathonState { RegistrationOpen, ReviewEnabled, Finished }

  // Public variables
  mapping(uint256 => Hackathon) public hackathons; // Stores hackathons data
  mapping(uint256 => mapping(address => Participant)) public hackathon_participants; // Stores participant data
  mapping(uint256 => address[]) public hackathon_participant_addresses; // Stores participant addresses
  // Rating history, enables correcting ratings and prevents rating
  mapping(uint256 => mapping(address => mapping(address => uint256))) public participant_ratings;
  uint256 public hackathon_count; // Helps generating a new hackathon id
  mapping(uint256 => mapping(address => bool)) public participant_has_cashed_out; // Helps preventing double cash out
  mapping(uint256 => uint256) public total_hackathon_points; // Helps calculating pot splits

  // Modifiers
  modifier paysEntryFee(uint256 hackathon_id)
  {
    require(msg.value == hackathons[hackathon_id].entry_fee, "Amount not equal to pay fee");
    _;
  }

  modifier hasNotJoined(uint256 hackathon_id)
  {
    require(hackathon_participants[hackathon_id][msg.sender].addr == address(0), "Participant has already joined");
    _;
  }

  modifier hasJoined(uint256 hackathon_id)
  {
    require(hackathon_participants[hackathon_id][msg.sender].addr != address(0), "Participant has not joined");
    _;
  }

  modifier pointsAreValid(uint256[] memory points, uint256 hackathon_id)
  {
    for (uint i=0; i<hackathon_participant_addresses[hackathon_id].length; i++) {
      require(points[i] <= 5, "A submited review has points greater than 5");
    }
    require(points.length == getParticipantCount(hackathon_id), "Amount of reviews submitted doesnt't match hackathon participant count");
    _;
  }

  modifier hasNotCashedOut(uint256 hackathon_id, address participant_addr)
  {
    require(!participant_has_cashed_out[hackathon_id][participant_addr], "Participant has already cashed out");
    _;
  }

  modifier isRegistrationOpen(uint256 hackathon_id)
  {
    require(hackathons[hackathon_id].state == HackathonState.RegistrationOpen, "Hackathon registration is not open");
    _;
  }

  modifier isReviewEnabled(uint256 hackathon_id)
  {
    require(hackathons[hackathon_id].state == HackathonState.ReviewEnabled, "Hackathon review is not enabled");
    _;
  }

  modifier isFinished(uint256 hackathon_id)
  {
    require(hackathons[hackathon_id].state == HackathonState.Finished, "Hackathon is not finished");
    _;
  }

  modifier isNotFinished(uint256 hackathon_id)
  {
    require(hackathons[hackathon_id].state != HackathonState.Finished, "Hackathon is finished");
    _;
  }

  modifier twoMonthFromCreation(uint256 hackathon_id)
  {
    require(block.timestamp >= hackathons[hackathon_id].creation_time + 60 days, "time must be greater than 2 months");
    _;
  }

  modifier oneWeekFromReview(uint256 hackathon_id)
  {
    require(block.timestamp >= hackathons[hackathon_id].enable_review_time + 7 days, "time must be greater than 1 week");
    _;
  }

  modifier isHackathonHost(uint256 hackathon_id)
  {
    require(hackathons[hackathon_id].host_addr == msg.sender, "You are not the hackathon host");
    _;
  }

  // Public methods
  function createHackathon(string memory _name, string memory image_hash, uint256 _entry_fee) public
  {
    hackathon_count += 1;
    uint256 date_now = block.timestamp;
    hackathons[hackathon_count] = Hackathon(msg.sender, HackathonState.RegistrationOpen, _name, image_hash, _entry_fee, 0, date_now, date_now);
    emit HackathonCreation(msg.sender, hackathon_count, _name, image_hash, _entry_fee, date_now);
  }

  function join(
    uint256 hackathon_id
  ) public payable paysEntryFee(hackathon_id) hasNotJoined(hackathon_id) isRegistrationOpen(hackathon_id)
  {
    Participant memory participant = Participant(msg.sender, 0);
    hackathon_participants[hackathon_id][msg.sender] = participant;
    hackathon_participant_addresses[hackathon_id].push(msg.sender);
    hackathons[hackathon_id].pot = hackathons[hackathon_id].pot.add(hackathons[hackathon_id].entry_fee);
    emit Registration(hackathon_id, msg.sender);
  }

  function sponsor(
    uint256 hackathon_id
  ) public payable isNotFinished(hackathon_id)
  {
    hackathons[hackathon_id].pot = hackathons[hackathon_id].pot.add(msg.value);
    emit SponsorshipSubmited(hackathon_id, msg.value);
  }

  function rateAll(
    uint256 hackathon_id,
    uint256[] memory points
  ) public hasJoined(hackathon_id) pointsAreValid(points, hackathon_id) isReviewEnabled(hackathon_id)
  {
    for (uint i=0; i<hackathon_participant_addresses[hackathon_id].length; i++) {
        address reviewed_address = hackathon_participant_addresses[hackathon_id][i];
        uint256 rating_stored = participant_ratings[hackathon_id][msg.sender][reviewed_address];
        hackathon_participants[hackathon_id][reviewed_address].points = hackathon_participants[hackathon_id][reviewed_address].points.add(
          points[i]).sub(rating_stored);
        total_hackathon_points[hackathon_id] = total_hackathon_points[hackathon_id].add(points[i]).sub(rating_stored);
        participant_ratings[hackathon_id][msg.sender][reviewed_address] = points[i];
    }
    emit RateAllSubmited(hackathon_id, msg.sender, points);
  }

  function cashOut(uint256 hackathon_id)
    public hasJoined(hackathon_id) hasNotCashedOut(hackathon_id, msg.sender) isFinished(hackathon_id) returns(uint256)
  {
    uint256 total_points = total_hackathon_points[hackathon_id];
    uint256 my_points = hackathon_participants[hackathon_id][msg.sender].points;

    // Calculate reward
    uint256 pot = hackathons[hackathon_id].pot;
    uint256 my_reward = pot.mul(my_points).div(total_points);

    payable(msg.sender).transfer(my_reward);
    participant_has_cashed_out[hackathon_id][msg.sender] = true;
    emit CashOut(hackathon_id, msg.sender, my_reward);
  }

  function enableHackathonReview(uint256 hackathon_id) public isHackathonHost(hackathon_id)
  {
    hackathons[hackathon_id].state = HackathonState.ReviewEnabled;
    hackathons[hackathon_id].enable_review_time = block.timestamp;
    emit HackathonReviewEnabled(hackathon_id);
  }

  function finishHackathon(uint256 hackathon_id) public isHackathonHost(hackathon_id)
  {
    hackathons[hackathon_id].state = HackathonState.Finished;
    emit HackathonFinished(hackathon_id);
  }

  // Force methods
  function forceFinishHackathon(uint256 hackathon_id) public isRegistrationOpen(hackathon_id) twoMonthFromCreation(hackathon_id)
  {
    hackathons[hackathon_id].state = HackathonState.Finished;
    emit HackathonFinished(hackathon_id);
  }

  function forceFinishHackathonFromReview(uint256 hackathon_id) public isReviewEnabled(hackathon_id) oneWeekFromReview(hackathon_id)
  {
    hackathons[hackathon_id].state = HackathonState.Finished;
    emit HackathonFinished(hackathon_id);
  }

  // View methods
  function getParticipantCount(uint256 hackathon_id) public view returns(uint participant_count) {
    return hackathon_participant_addresses[hackathon_id].length;
  }

  fallback () external payable {
    revert();
  }
}