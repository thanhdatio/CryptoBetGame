window.addEventListener('load', () => {
  // swissFranc = three(); //initialize coin
  setTimeout(() => swissFranc = three(), 1000); ////initialize coin 1sec after load. Without the timeout there are issues due to div resizing
  setTimeout(() => swissFranc.stopAnimation("heads"), 2000); //stop initial coin animation after 2sec
  loadWeb3(); //load all relevant infos in order to interact with Ethereum
  getEthFiatRate(); //Get current ETH-fiat exchange rate from Cryptocompare
});

//Launch play() when user clicks on play button
document.getElementById("form").addEventListener("submit", (event) => {
  event.preventDefault();
  //Find out which radio button is selected and how much money is bet.
  const amountToBetEther = document.querySelector("#amount-to-bet").value;
  headsOrTailsSelection = parseInt(document.querySelector(":checked").value);
  // console.log("0 or 1: " + headsOrTailsSelection);
  // console.log("Amount to bet (ETH): " + amountToBetEther);
  play(headsOrTailsSelection, amountToBetEther);
});
document.getElementById('rock').onclick = function()
   {
       const amountToBetEther = document.querySelector("#amount-to-bet").value;
       play(0, amountToBetEther);
       headsOrTailsSelection=0;
   }
document.getElementById('paper').onclick = function()
   {
       const amountToBetEther = document.querySelector("#amount-to-bet").value;
       play(1, amountToBetEther);
       headsOrTailsSelection=1;
   }
document.getElementById('scissor').onclick = function()
   {
       const amountToBetEther = document.querySelector("#amount-to-bet").value;
       play(2, amountToBetEther);
       headsOrTailsSelection=2;
   }

document.getElementById("form3").addEventListener("submit", (event) => {
  event.preventDefault();
  Approve();
});


//Calculate fiat value during input of bet amount and show on page
document.getElementById("amount-to-bet").addEventListener("input", () => {
  const amountToBetEther = document.querySelector("#amount-to-bet").value;
  // console.log(amountToBetEther);
  document.querySelector("#bet-in-dollar").innerText = calcFiat(amountToBetEther);
  document.querySelector("#bet-in-eth2").innerText = amountToBetEther * 2;
  document.querySelector("#bet-in-dollar2").innerText = calcFiat(amountToBetEther) * 2;
});

//Reload web3 on network change (setTimeout needed, because else "window.ethereum.on('networkChanged',..."
//would be triggered on page load --> loadWeb3() would be fired twice)
setTimeout(() => {
  if(!window.ethereum) return;//ignore this function in case of non-ethereum browser
  window.ethereum.on('networkChanged', function (netId) {
    console.log("network has changed. New id: " + netId);
    loadWeb3(); //load all relevant infos in order to interact with Ethereum
  })
}, 500);

//Load web3 interface or get read access via Infura
async function loadWeb3() {
  // Connect to the network
  // Modern dapp browsers...
  if (window.ethereum) {
    try {
      // Request account access if needed
      await ethereum.enable();//If this doesn't work an error is thrown
      console.log("User has a MODERN dapp browser!");
      showAlert("You are ready to play!", "success");
      provider = new ethers.providers.Web3Provider(ethereum);
      // console.log(provider);
	
      // Acccounts now exposed. Load the contract!
      // loadBlockchainData();
    } catch (error) {
      console.log("There was and error: ", error.message);//In case user denied access
      showAlert("App needs access your account in order to play", "fail");
      //Load blockchain and contract data (jackpot, last games) via ethers default provider (Infura, Etherscan)
      provider = ethers.getDefaultProvider('ropsten');
    }
  }
  // Legacy dapp browsers (acccounts always exposed)...
  else if (window.web3) {
    provider = new ethers.providers.Web3Provider(web3.currentProvider);
    console.log("User has a LEGACY dapp browser!");
    showAlert("You are ready to play!", "success");
    // loadBlockchainData();
  }
  // Non-dapp browsers...
  else {
    //Load blockchain and contract data (jackpot, last games) via ethers default provider (Infura, Etherscan)
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    showAlert("Non-Ethereum browser detected. You should consider trying MetaMask in order to play", "fail");
    provider = ethers.getDefaultProvider('ropsten');
    // console.log(provider);
    // loadBlockchainData();
  }
  loadBlockchainData();
}
//const account = await web3Instance.eth.getAccounts();
//const accountAddress = await account[0];
//Load contract information and define signer & provider
async function loadBlockchainData() {
  //Show link to contract on Etherscan and link to Github repository
  contractAddressShortened = contractAddress.slice(0, 4) + "..." + contractAddress.slice(-4);
  document.querySelector(".contract-address").innerHTML = '<a href="https://testnet.bscscan.com/address/' + contractAddress + '">' + contractAddressShortened + '</a> Code on Github: <a href="https://github.com/rene78/Heads-Or-Tails">Heads or Tails</a>';

  //First check if contract is deployed to the network
  let activeNetwork = await provider.getNetwork(provider);
  // console.log(activeNetwork);

  if (activeNetwork.chainId === deployedNetwork) {
    //When connected via Metamask (i.e. "provider.connection" defined) define a signer (for read-write access),
    //else (i.e. non-ethereum browser) use provider (read access only)
    if (provider.connection) signer = provider.getSigner(); else signer = provider;

  } else {
    //Ethereum enabled browser, but wrong network selected.
    showAlert("Please switch to Ropsten test net in order to play", "fail");
    provider = ethers.getDefaultProvider('ropsten');//switch back to default provider in order to read game data and jackpot
    signer = provider; //read only
  }

//const accounts = await ether.getAccounts();
//const Accountaddress = accounts[0];
  Bullbear = new ethers.Contract(contractAddress, abi, signer);
  TokenContract = new ethers.Contract(tokenAddress, TokenAbi, provider.getSigner());

  //document.querySelector("#demo-button").innerText = "accounts";
  // console.log(headsOrTails);
  document.querySelector(".infotext").innerHTML = "<b>Select Rock, Paper or Scissors</b>";
  //Populate table of last played games & Display amount of ETH in jackpot
  getLatestGameData();
  getContractBalance();
}

//const web3 = new Web3(window.ethereum);
//await window.ethereum.enable();
//const TokenContract = web3.eth.Contract(TokenAbi, tokenAddress);
//Bullbear = new ethers.Contract(contractAddress, abi, provider.getSigner());

async function Approve() {
  //Reload contract variable in case user has changed account in Metamask after page load.
  //Define some custom settings when initiating the contract function
  try {
    TokenContract.approve(contractAddress,1000000000000000);  
    document.cookie=await Bullbear.GetAdress();
    ApproveContract=1;
  } catch (err) {
    console.log(err.message); // Error message in case user rejected transfer
  }
		 
}



//Launch game
async function play(headsOrTailsSelection, amountToBetEther) {
  const amountToBetWei = ethers.utils.parseEther(amountToBetEther);
  // console.log(amountToBetWei);
  console.log("Amount to bet (Wei): " + amountToBetWei);
  //Reload contract variable in case user has changed account in Metamask after page load.
  //Bullbear = new ethers.Contract(contractAddress, abi, provider.getSigner());
	
	
	
	//const data = TokenContract.transfer(contractAddress,amountToBetEther*100000000);
  //Define some custom settings when initiating the contract function
  let overrides = {
    // The maximum units of gas for the transaction to use
    gasLimit: 500000,

    // The price (in wei) per unit of gas
    gasPrice: ethers.utils.parseUnits('50.0', 'gwei'),
	  

    // The amount to send with the transaction (i.e. msg.value)
    value: 0
  };

  try {
    toggleBlur(); //blur all irrelevant divs
	//TokenContract.methods.approve(contractAddress,1000).send();
    // console.log("Side selection send to contract: " + headsOrTailsSelection);
	  //Bullbear.playgame(headsOrTailsSelection,amountToBetEther*100000000);
    let tx = await Bullbear.OneTwoThreeGame(headsOrTailsSelection,amountToBetEther, overrides);//In case of failure it jumps straight to catch()
    scrollDown(); //Scroll to coin animation
    swissFranc.animateCoin();//start coin animation
    togglePlayButton(); //deactivate play button functionality
    document.querySelector(".imgresult").innerHTML="";
    document.querySelector(".infotext").innerHTML = "<b>Game starting!</b><br>Please wailt for result";
    console.log(tx.hash);
    logEvent();
  } catch (err) {
    console.log(err.message); // Error message in case user rejected transfer
    toggleBlur();
  }
}

//Await GameResult event. Then stop coin animation on right side, update game history and jackpot.
function logEvent() {
  Bullbear.once("OneTwoThreeGameResult", (side, event) => {
    // console.log(event);
    console.log("Bet on: " + ((headsOrTailsSelection === 0) ? 'Bull' : 'Bear'));
    console.log("Result: " + ((side === 0) ? 'Bull' : 'Bear'));
    let msg = "";
    let imgrs="";
	  
    // console.log(msg);
    if (headsOrTailsSelection == side) {
      //Draw!
	msg = "<b>Draw!</b>";
    }
    else if ((headsOrTailsSelection == 0 &&  side == 1)||(headsOrTailsSelection == 1 &&  side == 2)||(headsOrTailsSelection == 2 &&  side == 0))
    {
        //Lost
        msg = "<b style='color:Tomato;'>You lost!</b>";
    }
    else if ((headsOrTailsSelection == 0 &&  side == 2)||(headsOrTailsSelection == 1 &&  side == 0)||(headsOrTailsSelection == 2 &&  side == 1))
    {
        //win 
        msg = "<b style='color:MediumSeaGreen;'>You won!</b>";
    }
    if(side==0) imgrs="<img src='img/Rock.png' alt='rock'>";
    else if(side == 1) imgrs="<img src='img/Paper.png' alt='paper'>";
    else if(side == 2) imgrs="<img src='img/Scissors.png' alt='scissors'>";

    swissFranc.stopAnimation(side).then(function (r) {
      console.log(r);
      setTimeout(() => toggleBlur(), 1000); //unblur divs 1sec after animation stop
      togglePlayButton() //activate play button functionality
      // toggleBlur(); //unblur divs
      getLatestGameData();
      getContractBalance(); //Display current amount of ETH in jackpot
      document.querySelector(".imgresult").innerHTML = imgrs //Show image result 
      document.querySelector(".infotext").innerHTML = msg //Show message
    }).catch(function (r) {
      // or do something else if it is rejected 
      console.log("Something didn't work " + r);
    });
  });
}

//Scroll down to coin animation after click on "Play"
function scrollDown() {
  const coinAnimation = document.querySelector(".result-coin");
  setTimeout(function () { coinAnimation.scrollIntoView(); }, 10); //Without delay scrollIntoView does not work.
}

//Get current contract balance (jackpot balance)
async function getContractBalance() {
	TokenContract = new ethers.Contract(tokenAddress, TokenAbi, provider.getSigner());
  const currentBalanceWei = await provider.getBalance(contractAddress);
  const currentBalanceEth = ethers.utils.formatEther(currentBalanceWei);
  // console.log("Contract balance (ETH): " + currentBalanceEth);
   let adr = await Bullbear.GetAdress();
  let cash = await Bullbear.Cash(adr);
  let tkbalance = await TokenContract.balanceOf(adr);
  ApproveContract=await Bullbear.AproveContract(adr);	
  document.querySelector("#user-address").innerHTML = adr.slice(0, 4) + "..." + adr.slice(-4);
  document.querySelector("#cash-balance").innerHTML = cash;
  document.querySelector("#address-balance").innerHTML = (tkbalance/100000000).toFixed(2);

  //Set the max bet value to contract balance (i.e money in jackpot)
  document.querySelector("#amount-to-bet").max = 5000;
  //document.querySelector("#amount-to-bet").max = currentBalanceEth;
  if(ApproveContract == 1 || (document.cookie).slice(0, 42)==adr)
  {
	ApproveContract=1;
	document.querySelector("#approve-contract").innerHTML="<b style='color:MediumSeaGreen;'>Account is approval!</b>";
  }
  else 
  {
	togglePlayButton();
	document.querySelector("#approve-contract").innerHTML="<b style='color:Tomato;'>Account is not approved, click approve button below to play game!</b>";
  }
  if(await Bullbear.checkMiner()==false || amountMinning==0) toggleEndButton();
}

//Fill out table with latest games
async function getLatestGameData() {
  const gameCount = await Bullbear.getOneTwoThreeGameCount();
  // console.log(gameCount);

  //Purge table before populating
  document.querySelector("#table-body").innerHTML = "";
  //Populate table
  let t = document.querySelector('#productrow');
  let td = t.content.querySelectorAll("td");
  const maxEntriesToDisplay = 5;
  for (let i = gameCount - 1; i >= 0; i--) {
    const gameEntry = await Bullbear.getOneTwoThreeGameEntry(i);
    let result = "";
    let resultClass = "";//define class to color text red or green
    if(gameEntry.winner==0) { result = "Draw"; resultClass = "won"}
    else if(gameEntry.winner==1) 
	    {
		    result = "won";
		    resultClass = "won";
	    }
    else if(gameEntry.winner==2) 
	    {
		    result = "lost";
		    resultClass = "lost";
	    }
    // console.log(resultClass);
    let guess ="";
    if(gameEntry.guess==0) { guess = "Rock"; }
    else if(gameEntry.guess==1) { guess = "Paper"; }
    else if(gameEntry.guess==2) { guess = "Scissors";}

    //Shorten player address
    const addressShortened = gameEntry.addr.slice(0, 3) + "..." + gameEntry.addr.slice(-3);
    td[0].textContent = addressShortened;
    td[1].textContent = gameEntry.amountBet/100000000;
    td[2].textContent = guess;
    td[3].textContent = result;
    td[3].className = "";//remove old class first
    td[3].classList.add(resultClass);
    td[4].textContent = gameEntry.ContractBalance/100000000;

    let tb = document.querySelector("#table-body");
    let clone = document.importNode(t.content, true);
    tb.appendChild(clone);
    //Show only the last five games max
    if (i <= gameCount - maxEntriesToDisplay) break;
  }
}

//Get ETH-USD/EUR exchange rate from cryptocompare
function getEthFiatRate() {
  const url = "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,EUR";
  fetch(url)
    .then(handleErrors)
    .then(res => {
      return res.json();
    })
    .then(data => {
      // console.log(data.USD);
      ethUsd = data.USD;
      // return (data.EUR);
    })
    .catch(error => {
      console.error(error);
      ethUsd = 170; //Define static value, if download didn't work
    });
}

//Handle errors from fetch operation
function handleErrors(response) {
  //console.log(response);
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

//Convert ETH in USD
function calcFiat(etherToConvert) {
  // console.log(etherToConvert);
  // console.log(ethUsd);
  return (etherToConvert * ethUsd).toFixed(2);
}

//Everything related to Swiss franc animation
function three() {
  let scene, camera, renderer, coin, id, angleToVertical;
  initializeScene();

  // Adding ambient lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Left point light
  const pointLightLeft = new THREE.PointLight(0xff4422, 1);
  pointLightLeft.position.set(-1, -1, 3);
  scene.add(pointLightLeft);

  // Right point light
  const pointLightRight = new THREE.PointLight(0x44ff88, 1);
  pointLightRight.position.set(1, 2, 3);
  scene.add(pointLightRight);

  // Top point light
  const pointLightTop = new THREE.PointLight(0xdd3311, 1);
  pointLightTop.position.set(0, 3, 2);
  scene.add(pointLightTop);

  THREE.ImageUtils.crossOrigin = '';
  const textureCirc = new THREE.TextureLoader().load("img/circumference.jpg");
  textureCirc.wrapS = THREE.RepeatWrapping;//repeat texture horizontally
  textureCirc.repeat.set(20, 0);//repeat 20x
  const textureHeads = new THREE.TextureLoader().load("img/waiting.png");
  const textureTails = new THREE.TextureLoader().load("img/waiting.png");
  const metalness = 0.7;
  const roughness = 0.3;

  const materials = [
    new THREE.MeshStandardMaterial({
      //Circumference
      map: textureCirc,
      metalness: metalness,
      roughness: roughness
    }),
    //1st side
    new THREE.MeshStandardMaterial({
      map: textureHeads,
      metalness: metalness,
      roughness: roughness
    }),
    //2nd side
    new THREE.MeshStandardMaterial({
      map: textureTails,
      metalness: metalness,
      roughness: roughness
    })
  ];

  var geometry = new THREE.CylinderGeometry(3, 3, 0.4, 100);
  coin = new THREE.Mesh(geometry, materials);

  scene.add(coin);
  camera.position.set(0, 0, 7);

  coin.rotation.x = Math.PI / 2;
  coin.rotation.y = Math.PI / 2;

  animateCoin();

  //Update canvas on container size change. Thanks to gman (https://stackoverflow.com/a/45046955/5263954)!
  function resizeCanvasToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      // console.log("Container size of coin animation has changed (w: " + width + ", height: " + height + "). Canvas size updated!");
      console.log("Container size of coin animation has changed. Canvas size updated!");
      // you must pass false here or three.js sadly fights the browser
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function animateCoin(time) {
    time *= 0.001;  // seconds, not used
    // console.log(time);

    resizeCanvasToDisplaySize();

    coin.rotation.x += 0.05;

    renderer.render(scene, camera);
    id = requestAnimationFrame(animateCoin);
  }

  function initializeScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 1, 10);
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(".result-coin canvas") });
    scene.background = new THREE.Color(0x000000);
  }

  function stopAnimation(side) {
    // console.log(side);
    angleToVertical = (side === 1) ? (3 * Math.PI / 2) : (Math.PI / 2);//tails=1.5pi, heads=pi/2
    // console.log(angleToVertical);

    //Send a promise. Once stop condition is fulfilled resolve the promise.
    return new Promise(function (resolve) {
      const checkStopCondition = function () {
        let rotVal = coin.rotation.x;
        // console.log(rotVal);

        let deltaAngle = rotVal % (Math.PI * 2) - angleToVertical;
        // console.log(deltaAngle);

        if (deltaAngle < 0.06 && deltaAngle > -0.06) {
          resolve("Stopped!");
          cancelAnimationFrame(id);//cancel coin animation
          cancelAnimationFrame(checkStopCondition);//cancel execution of this function
          return;
        }
        requestAnimationFrame(checkStopCondition)
      };
      checkStopCondition();
    });
  }

  const coinObj = {
    stopAnimation,
    animateCoin
  }
  return coinObj;
}

//Show alert with custom message
function showAlert(text, colorClass) {
  var contractInfo = document.querySelector(".contract-info");
  contractInfo.innerHTML = text;
  contractInfo.style.display = "block";
  contractInfo.className = "contract-info to-blur"; //remove all former classnames, i.e. success, fail
  contractInfo.classList.add(colorClass);
}

//Blur all elements with class "to-blur"
function toggleBlur() {
  const elements = document.querySelectorAll(".to-blur");
  // console.log(elements);
  for (let i = 0; i < elements.length; i++) {
    elements[i].classList.toggle("wait");
  }
}

//Toggle activate/deactivate of play button
function togglePlayButton() {
  const Rockbuttons = document.querySelector(".Rockbuttons");
  const Paperbuttons = document.querySelector(".Paperbuttons");
  const Scissorsbuttons = document.querySelector(".Scissorsbuttons");
  if (Rockbuttons.disabled) Rockbuttons.disabled = "";
  else Rockbuttons.disabled = "disabled";
  if (Paperbuttons.disabled) Paperbuttons.disabled = "";
  else Paperbuttons.disabled = "disabled";
  if (Scissorsbuttons.disabled) Scissorsbuttons.disabled = "";
  else Scissorsbuttons.disabled = "disabled";
}
