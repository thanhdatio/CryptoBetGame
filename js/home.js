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
  //headsOrTailsSelection = parseInt(document.querySelector(":checked").value);
  // console.log("0 or 1: " + headsOrTailsSelection);
  // console.log("Amount to bet (ETH): " + amountToBetEther);
  play(headsOrTailsSelection, amountToBetEther);
});
document.getElementById('bull').onclick = function()
   {
       const amountToBetEther = document.querySelector("#amount-to-bet").value;
       play(0, amountToBetEther);
       headsOrTailsSelection=0;
   }
document.getElementById('bear').onclick = function()
   {
       const amountToBetEther = document.querySelector("#amount-to-bet").value;
       play(1, amountToBetEther);
       headsOrTailsSelection=1;
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
    let tx = await Bullbear.BullBearGame(headsOrTailsSelection,amountToBetEther, overrides);//In case of failure it jumps straight to catch()
    scrollDown(); //Scroll to coin animation
    swissFranc.animateCoin();//start coin animation
    togglePlayButton(); //deactivate play button functionality
    document.querySelector(".imgresult").innerHTML = "<img src='img/bb.gif' alt='BullBear' width='300' height='300'>";
    //document.querySelector(".infotext").innerHTML = "<b>Game starting!</b><br>Please wailt for result";
    console.log(tx.hash);
    logEvent();
  } catch (err) {
    console.log(err.message); // Error message in case user rejected transfer
    toggleBlur();
  }
}

//Await GameResult event. Then stop coin animation on right side, update game history and jackpot.
function logEvent() {
  Bullbear.once("BullBearGameResult", (side, event) => {
    // console.log(event);
    console.log("Bet on: " + ((headsOrTailsSelection === 0) ? 'Bull' : 'Bear'));
    console.log("Result: " + ((side === 0) ? 'Bull' : 'Bear'));
    const msg = (side === headsOrTailsSelection) ? "<b style='color:MediumSeaGreen;'>You won!</b>" : "<b style='color:Tomato;'>You lost!</b>";
    // console.log(msg);
    let imgrs="";
    if(side==0) imgrs="<img src='img/bull.png' alt='bull' width='300' height='300'>";
    else if(side == 1) imgrs="<img src='img/bear.png' alt='bear' alt='bull' width='300' height='300'>";
    
	  
	  
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
	//TokenContract = new ethers.Contract(tokenAddress, TokenAbi, provider.getSigner());
  Bullbear = new ethers.Contract(contractAddress, abi, signer);
  TokenContract = new ethers.Contract(tokenAddress, TokenAbi, provider.getSigner());
  const currentBalanceWei = await provider.getBalance(contractAddress);
  const currentBalanceEth = ethers.utils.formatEther(currentBalanceWei);
  // console.log("Contract balance (ETH): " + currentBalanceEth);
  let adr = await Bullbear.GetAdress();
  let cash = await Bullbear.Cash(adr);
  let tkbalance = await TokenContract.balanceOf(adr);
  ApproveContract=await Bullbear.AproveContract(adr);	
  document.querySelector(".infotext").innerHTML = "<b>Select Bull or Bear</b>";
  //document.querySelector(".imgresult").innerHTML = "<img src='img/bullbear.png' alt='BullBear' width='400' height='220'>";
  document.querySelector("#user-address").innerHTML = adr.slice(0, 4) + "..." + adr.slice(-4);
  document.querySelector("#cash-balance").innerHTML = cash;
  document.querySelector("#address-balance").innerHTML = (tkbalance/100000000).toFixed(2);
  //document.querySelector(".imgconnect").innerHTML = "<img src='img/connected.png' width='20' height='20'>";
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
}

//Fill out table with latest games
async function getLatestGameData() {
  const gameCount = await Bullbear.getBullBearGameCount();
  // console.log(gameCount);

  //Purge table before populating
  document.querySelector("#table-body").innerHTML = "";
  //Populate table
  let t = document.querySelector('#productrow');
  let td = t.content.querySelectorAll("td");
  const maxEntriesToDisplay = 5;
  for (let i = gameCount - 1; i >= 0; i--) {
    const gameEntry = await Bullbear.getBullBearGameEntry(i);
    let result = gameEntry.winner ? "Won" : "Lost";
    let resultClass = gameEntry.winner ? "won" : "lost";//define class to color text red or green
    // console.log(resultClass);
    let guess = gameEntry.guess == 0 ? "Bull" : "Bear";
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
  const playButton = document.querySelector(".play-button");
  if (playButton.disabled) playButton.disabled = "";
  else playButton.disabled = "disabled";
}
function toggleApprove3Button() {
  const ApproveButton = document.querySelector(".play-button3");
  if (ApproveButton.disabled) ApproveButton.disabled = "";
  else ApproveButton.disabled = "disabled";
}
