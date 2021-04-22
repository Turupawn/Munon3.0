pragma solidity ^0.8.0;

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
    uint256 creation_time,
    string[] metrics
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
    string[] metrics;
  }

  // Enums
  enum HackathonState { RegistrationOpen, ReviewEnabled, Finished }

  // Public variables
  uint256 public hackathon_count; // Helps generating a new hackathon id
  mapping(uint256 => Hackathon) public hackathons; // Stores hackathons data
  mapping(uint256 => address[]) public participant_addresses; // Helps iterating through all participants
  mapping(uint256 => mapping(address => bool)) public participant_has_joined; // Helps preventing double join
  mapping(uint256 => mapping(address => uint256)) public participant_points; // Helps calculating pot distribution
  mapping(uint256 => mapping(address => bool)) public participant_has_cashed_out; // Helps preventing double cash out
  mapping(uint256 => mapping(address => mapping(address => mapping(uint256 => uint256)))) public participant_ratings; // Stores rating, enables correcting ratings and prevents double rating

  // Modifiers
  modifier hasAtLeastOneMetric(string[] memory metrics)
  {
    require(metrics.length >= 1, "There must be at least one metric");
    _;
  }

  modifier paysEntryFee(uint256 hackathon_id)
  {
    require(msg.value == hackathons[hackathon_id].entry_fee, "Amount not equal to pay fee");
    _;
  }

  modifier hasNotJoined(uint256 hackathon_id)
  {
    require(participant_has_joined[hackathon_id][msg.sender], "Participant has already joined");
    _;
  }

  modifier hasJoined(uint256 hackathon_id)
  {
    require(!participant_has_joined[hackathon_id][msg.sender], "Participant has not joined");
    _;
  }

  modifier pointsAreValid(uint256[][] memory points, uint256 hackathon_id)
  {
    require(points.length == getParticipantCount(hackathon_id), "Amount of reviews submitted doesnt't match hackathon participant count.");
    for (uint participant_iterator=0; participant_iterator<points.length; participant_iterator++)
    {
      require(points[participant_iterator].length == hackathons[hackathon_id].metrics.length, "Amount of metrics submitted doesnt't match hackathon metric count.");
      for (uint metric_iterator=0; metric_iterator<points[participant_iterator].length; metric_iterator++)
      {
        require(points[participant_iterator][metric_iterator] <= 5, "A submited review has points greater than 5");
      }
    }
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
  function createHackathon(
    string memory _name,
    string memory image_hash,
    uint256 _entry_fee,
    string[] memory metrics
  ) public hasAtLeastOneMetric(metrics)
  {
    hackathon_count += 1;
    uint256 date_now = block.timestamp;
    hackathons[hackathon_count] = Hackathon(msg.sender, HackathonState.RegistrationOpen, _name, image_hash, _entry_fee, 0, date_now, date_now, metrics);
    emit HackathonCreation(msg.sender, hackathon_count, _name, image_hash, _entry_fee, date_now, metrics);
  }

  function join(
    uint256 hackathon_id
  ) public payable paysEntryFee(hackathon_id) hasNotJoined(hackathon_id) isRegistrationOpen(hackathon_id)
  {
    participant_has_joined[hackathon_id][msg.sender] = true;
    participant_addresses[hackathon_id].push(msg.sender);
    hackathons[hackathon_id].pot += hackathons[hackathon_id].entry_fee;
    emit Registration(hackathon_id, msg.sender);
  }

  function sponsor(
    uint256 hackathon_id
  ) public payable isNotFinished(hackathon_id)
  {
    hackathons[hackathon_id].pot += msg.value;
    emit SponsorshipSubmited(hackathon_id, msg.value);
  }

  function rateAll(
    uint256 hackathon_id,
    uint256[][] memory points
  ) public hasJoined(hackathon_id) pointsAreValid(points, hackathon_id) isReviewEnabled(hackathon_id)
  {
    for (uint current_participant=0; current_participant<participant_addresses[hackathon_id].length; current_participant++) {
        address reviewed_address = participant_addresses[hackathon_id][current_participant];
        for (uint current_metric=0; current_metric<points[current_participant].length; current_metric++)
        {
          uint256 rating_stored = participant_ratings[hackathon_id][msg.sender][reviewed_address][current_metric];
          participant_points[hackathon_id][reviewed_address] = participant_points[hackathon_id][reviewed_address] + points[current_participant][current_metric] - rating_stored;
          participant_ratings[hackathon_id][msg.sender][reviewed_address][current_metric] = points[current_participant][current_metric];
        }
    }
    //emit RateAllSubmited(hackathon_id, msg.sender, points);
  }

  function cashOut(uint256 hackathon_id)
    public hasJoined(hackathon_id) hasNotCashedOut(hackathon_id, msg.sender) isFinished(hackathon_id)
  {
    uint256 total_points = getHackathonTotalPoints(hackathon_id);
    uint256 my_points = participant_points[hackathon_id][msg.sender];

    // Calculate reward
    uint256 pot = hackathons[hackathon_id].pot;
    uint256 my_reward = pot * my_points / total_points;

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
    return participant_addresses[hackathon_id].length;
  }

  function getHackathonTotalPoints(uint256 hackathon_id) public view returns(uint256 total_points) {
    address[] memory addresses = participant_addresses[hackathon_id];
    uint256 result = 0;
    for(uint i=0; i<addresses.length; i++)
    {
      for(uint j=0; j<addresses.length; j++)
      {
        for(uint k=0; k<hackathons[hackathon_id].metrics.length; k++)
        {
          result += participant_ratings[hackathon_id][addresses[i]][addresses[j]][k];
        }
      }
    }
    return result;
  }

  function getMetrics(uint256 hackathon_id) public view returns(string[] memory metrics) {
    return hackathons[hackathon_id].metrics;
  }

  fallback () external payable {
    revert();
  }
}