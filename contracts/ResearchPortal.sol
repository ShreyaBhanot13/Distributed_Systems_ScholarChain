// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ResearchPortal {

    enum Role { Unregistered, Author, Faculty, Reviewer }
    struct User {
        Role role;
        string name;
    }

    struct Paper {
        uint256 paperId;
        address author;
        string title;
        string ipfsHash;
        uint256 timestamp;
        string[] reviews;
    }

    address public owner;
    uint256 public paperCount;
    mapping(address => User) public users;
    mapping(uint256 => Paper) public papers;

    // NEW: Per-paper access control: paperId -> userAddress -> access level (1=View, 2=Comment, 3=Edit)
    mapping(uint256 => mapping(address => uint8)) public paperAccess;

    // ==== Events ====
    event UserRegistered(address indexed user, string name, Role role);
    event PaperSubmitted(uint256 indexed paperId, address indexed author, string title, string ipfsHash);
    event ReviewAdded(uint256 indexed paperId, address indexed reviewer, string comment);

    constructor() {
        owner = msg.sender;
    }

    // ==== User Registration ====
    function register(address _user, string memory _name, uint8 _role) public {
        require(_role > 0 && _role <= 3, "Invalid role");
        users[_user] = User(Role(_role), _name);
        emit UserRegistered(_user, _name, Role(_role));
    }

    // ==== Submit Paper ====
    function submitPaper(string memory _title, string memory _ipfsHash) public {
        require(users[msg.sender].role == Role.Author, "Only authors can submit papers");
        paperCount++;
        Paper storage newPaper = papers[paperCount];
        newPaper.paperId = paperCount;
        newPaper.author = msg.sender;
        newPaper.title = _title;
        newPaper.ipfsHash = _ipfsHash;
        newPaper.timestamp = block.timestamp;

        emit PaperSubmitted(paperCount, msg.sender, _title, _ipfsHash);
    }

    // ==== Add Review ====
    function addReview(uint256 _paperId, string memory comment) public {
    // Allow authors, faculty, and reviewers to add reviews
    require(users[msg.sender].role == Role.Faculty || users[msg.sender].role == Role.Reviewer || users[msg.sender].role == Role.Author, "Not allowed to review");

    // Only allow users with access level >= 2 (Comment or higher) to add a review
    require(paperAccess[_paperId][msg.sender] >= 2, "Insufficient access level to comment");

    papers[_paperId].reviews.push(comment);
    emit ReviewAdded(_paperId, msg.sender, comment);
}


    // ==== Get Single Paper ====
    function getPaper(uint256 _paperId) public view returns (
        uint256,
        address,
        string memory,
        string memory,
        uint256,
        string[] memory
    ) {
        Paper storage p = papers[_paperId];
        return (
            p.paperId,
            p.author,
            p.title,
            p.ipfsHash,
            p.timestamp,
            p.reviews
        );
    }

    // ==== Get All Papers (optional frontend use) ====
    function getAllPapers() public view returns (Paper[] memory) {
        Paper[] memory all = new Paper[](paperCount);
        for (uint256 i = 1; i <= paperCount; i++) {
            all[i - 1] = papers[i];
        }
        return all;
    }

    // ==== NEW: Grant Access to Ethereum Addresses ====
    function grantAccess(uint256 _paperId, address _user, uint8 _accessLevel) public {
        require(papers[_paperId].author == msg.sender, "Only author can grant access");
        require(_accessLevel >= 1 && _accessLevel <= 3, "Access must be 1 (View), 2 (Comment), or 3 (Edit)");
        paperAccess[_paperId][_user] = _accessLevel;
    }

    // ==== Check Access Level for Paper ====
    function getAccessLevel(uint256 _paperId, address _user) public view returns (uint8) {
        return paperAccess[_paperId][_user];
    }
}
