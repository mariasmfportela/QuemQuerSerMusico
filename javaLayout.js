//global variables (used across multiple pages)
var easyQ = [];
var medQ = [];
var hardQ = [];
var levelDist = [5, 5, 5];
var currentQ = {level:"", index:-1, type:"", count:0};
var correctCount = 0;
var path = "";
var score = 0;

//global variables (used in only one page)
var correctAnswer = "";
var bonusScore = 0;
var mainTimer;
var bonusTimer;
var explainLength = 0;
var wrong = false;

//handle path names
setPath();
function setPath() {
  var w = window.location.href;
  var w1 = w.split("index.html");
  var w2 = w.split(".html");
  var w3 = w.split("level.html");
  
  if (w1.length > 1) {
    path = w.replace("index.html", "");
    sessionStorage.clear();
  }
  else if (w2.length == 1) {
    path = w;
    window.location.replace(path + "index.html");
    sessionStorage.clear();
  }
  else if (w3.length <= 1) {
    getSessionStorage();
  }
}

//handle session storage
function setSessionStorage() {
  sessionStorage.setItem("easyQ", JSON.stringify(easyQ));
  sessionStorage.setItem("medQ", JSON.stringify(medQ));
  sessionStorage.setItem("hardQ", JSON.stringify(hardQ));
  sessionStorage.setItem("levelDist", JSON.stringify(levelDist));
  sessionStorage.setItem("currentQ", JSON.stringify(currentQ));
  sessionStorage.correctCount = correctCount;
  sessionStorage.path = path;
  sessionStorage.setItem("score", JSON.stringify(score));
}

function getSessionStorage() {
  easyQ = JSON.parse(sessionStorage.getItem("easyQ"));
  medQ = JSON.parse(sessionStorage.getItem("medQ"));
  hardQ = JSON.parse(sessionStorage.getItem("hardQ"));
  levelDist = JSON.parse(sessionStorage.getItem("levelDist"));
  currentQ = JSON.parse(sessionStorage.getItem("currentQ"));
  correctCount = sessionStorage.correctCount;
  path = sessionStorage.path;
  score = JSON.parse(sessionStorage.getItem("score"));
}

//helper functions
function displayText(x, tag, i) {
  //displays the text from the question list, given the parent node, the child node name and it's index
  var y = x.getElementsByTagName(tag)[i].childNodes[0].nodeValue;
  return y;
}

function displayInt(x, n) {
  //displays a integer with the specified number of digits
  var y = x.toString();
  for (i = n - 1; i > 0; i = i - 1){
    if (x < Math.pow(10, i)) {
      y = "0" + y;
    } else {
      i = 0;
    }
  }
  
  return y;
}

function randomInt(min, max) {
  //random number between min and max, including min and excluding max
  return Math.floor(Math.random() * (max - min) ) + min;
}

//zoom on images
function imageOn() {
  var x = window.matchMedia("(min-width: 700px) and (min-height: 570px)");
  if (x.matches) {
    document.getElementById("imageOverlay").style.display = "block";
  }
}

function imageOff() {
  document.getElementById("imageOverlay").style.display = "none";
}

//timers and score
function updateScore(x) {
  //update score
  score += x;
  var element = document.getElementById("score");
  
  //animation for updating score
  element.className = "animation";
  element.innerHTML = displayInt(score, 4);
  setTimeout(function(){element.className = "";}, 500);
  
  //reset variable
  x = 0;
}

function bonusTimer() {
  //score bonus if user reads the solution
  document.getElementById("timeBonus").innerHTML = "Bónus de aprendizagem:";
  var time = 0;
  var maxTime = explainLength*300;
  bonusTimer = setInterval(function() {
    if (time <= maxTime) {
      time += 100;
      bonusScore = Math.floor(time*5/maxTime)*10;
      document.getElementById("timer").innerHTML = displayInt(bonusScore, 2);
    } else {
      clearInterval(bonusTimer);   
    }
  }, 100);
}

function mainTimer() {
  var time = 0;
  mainTimer = setInterval(function() {
    time += 100;
    if (time == 21000) {
      clearInterval(mainTimer);
    } else if (time >= 1000) {
      bonusScore = Math.floor(50 - (time-1000)/400);    
    } else {
      bonusScore = 50;
    }
    document.getElementById("timer").innerHTML = displayInt(bonusScore, 2); 
    }, 100);
}

//ajax function to handle xml requests
function fn(someFunction) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      someFunction(this);
    }
  };
  xhttp.open("GET", "perguntas.xml", true);
  xhttp.send();
}

//set question arrays to avoid question duplicates
function setup(xml) {
  var x = xml.responseXML;
  var i;
  
  for (i = 0; i < x.getElementsByTagName("easy").length; i++) {
    easyQ.push(0);
  }
  for (i = 0; i < x.getElementsByTagName("med").length; i++) {
    medQ.push(0);
  }
  for (i = 0; i < x.getElementsByTagName("hard").length; i++) {
    hardQ.push(0);
  }
  
  //makes changes to global variables available to other pages
  setSessionStorage();
  
  fn(nextQuestion);
}

//chose next question and go to corresponding page
function nextQuestion(xml) {
  var x = xml.responseXML;
  var nextPage = "";

  if (bonusScore !== 0) {
    if (wrong) clearInterval(bonusTimer);
    updateScore(bonusScore);
  }

  //choses next question level and index
  currentQ.index = -1;
  while (currentQ.index === -1) {
    var rand = 0;
    
    if (currentQ.count < levelDist[0]) {
      currentQ.level = "easy";
      
      rand = randomInt(0, easyQ.length);        
      if (easyQ[rand] === 0) {
        currentQ.index = rand;
        easyQ[rand] = 1;
      }
    }
    else if (currentQ.count < (levelDist[0] + levelDist[1])) {
      currentQ.level = "med";
      
      rand = randomInt(0, medQ.length);
      if (medQ[rand] === 0) {
        currentQ.index = rand;
        medQ[rand] = 1;
      } 
    }
    else if (currentQ.count < 15) {
      currentQ.level = "hard";
      
      rand = randomInt(0, hardQ.length);
      if (hardQ[rand] === 0) {
        currentQ.index = rand;
        hardQ[rand] = 1;
      } 
    }
  }
  
  //set page to show
  currentQ.type = x.getElementsByTagName(currentQ.level)[currentQ.index].getElementsByTagName("title")[0].attributes.getNamedItem("type").nodeValue;
  
  if (currentQ.type === "simple") {
    nextPage = path + "questionSimple.html";
  }
  else if (currentQ.type === "image") {
    nextPage = path + "questionImage.html";
  }
  else if (currentQ.type === "audio") {
    nextPage = path + "questionAudio.html";
  }
  
  //goes to that page
  setTimeout(function(){window.location.replace(nextPage);}, 500);

  //makes changes to global variables available to other pages
  setSessionStorage();
}

//display question content
function displayQuestion(xml) {
  var x = xml.responseXML.getElementsByTagName(currentQ.level);
  var i = currentQ.index;  
  var n = 0;
  var choices = [0, 0, 0, 0];
  var levelText = document.getElementById("levelText");
  
  //writes the question on the page
  document.getElementById("qText").innerHTML = displayText(x[i], "title", 0);
  
  //writes the answer explanation
  document.getElementById("explain").innerHTML = displayText(x[i], "explain", 0);
  explainLength = displayText(x[i], "explain", 0).split(" ").length;
  
  //displays the image element, if there is one
  if (currentQ.type === "image") {
    var img = x[i].getElementsByTagName('media')[0].childNodes[0].nodeValue;
    document.getElementById("imageFile").src = img;
    document.getElementById("imageFileOverlay").src = img;
  }
  
  //displays the audio element, if there is one
  if (currentQ.type === "audio") {
    document.getElementById("audioFile").src = x[i].getElementsByTagName('media')[0].childNodes[0].nodeValue;
  }
  
  //writes the choices in a random order  
  while (n < 4) {
    var rand = randomInt(0, 4);
    
    if (choices[rand] === 0) {
      document.getElementById("ch" + (rand + 1)).innerHTML = displayText(x[i], "choice", n);
      
      //verifies if this is the correct answer
      if (x[i].getElementsByTagName("choice")[n].attributes.length === 1) {
        if (rand === 0) {
          correctAnswer = "a";
        }
        if (rand === 1) {
          correctAnswer = "b";
        }
        if (rand === 2) {
          correctAnswer = "c";
        }
        if (rand === 3) {
          correctAnswer = "d";
        }
      }
      
      //keeps the loop running
      choices[rand] = 1;
      n++;
    }
  }
  
  //display question number and level
  if (currentQ.level == "easy") {
    levelText.innerHTML = "Fácil ";
  } else if (currentQ.level == "med") {
    levelText.innerHTML = "Médio ";
  } else {
    levelText.innerHTML = "Difícil ";
  }
  levelText.innerHTML += (currentQ.count + 1).toString();
  
  //score and timer
  document.getElementById("score").innerHTML = displayInt(score, 4);
  document.getElementById("timeBonus").innerHTML = "Bónus de tempo:";
  mainTimer();
}

//handle user answer
function getAnswer() {
  
  var form = document.getElementById("form");
  var answered = false;
  var answerValue = "";
  var i = 0;
  var add = 0;
  
//loops through radio buttons to check which one is checked
  for (i = 0; i < form.length; i++) {
    if (form.elements[i].checked) {
      answered = true;
      answerValue = form.elements[i].value;
    }
  }
  
//checks if the user picked the correct answer
  if (answered) {
    
    clearInterval(mainTimer);
        
    var element = document.getElementById("answerResult");
    
    //keep track of question count
    currentQ.count++;
    
    //correct answer (green)
    if (answerValue == correctAnswer) {
      wrong = false;
      correctCount++;
      element.style.color = "rgb(33, 247, 26)";
      element.innerHTML = "Resposta certa!";
      
      //update score
      if (currentQ.level == "easy") {
        add = 100;
      }
      else if (currentQ.level == "med") {
        add = 150;
      }
      else if (currentQ.level == "hard") {
        add = 200;
      }
      updateScore(add);
    }
    
    //wrong answer (red)
    else {
      bonusTimer();
      wrong = true;
      element.style.color = "rgb(255, 49, 0)";
      element.innerHTML = "Resposta errada!";  
    }
    
    //check for end of game
    if (currentQ.count === 15) {
      document.getElementById("btn3").style.display = "block";
    }
    else {
      document.getElementById("btn2").style.display = "block";
    }
    
    //writes the result
    document.getElementById("answer").style.display = "block";
    document.getElementById("btn1").style.display = "none";
    
    //pauses and hides the audio controls
    if (currentQ.type == "audio") {
      var a = document.getElementById("audioFile");
      a.pause();
      a.controls = false;
    }
  }
}

//end of the game
function gameOver() {

  if (wrong) clearInterval(bonusTimer);
  updateScore(bonusScore);
  document.getElementById("timer").innerHTML = "00";
  
  document.getElementById("form").style.visibility = "hidden";
  document.getElementById("qText").innerHTML = "";
  document.getElementById("btn3").style.display = "none";
  document.getElementById("btn4").style.display = "block";

  if (currentQ.type === "image") {
    document.getElementById("textCol").classList.toggle("col-md-12");
    document.getElementById("imageFile").style.display = "none";

  }
  if (currentQ.type === "audio") {
    document.getElementById("audioFile").style.display = "none";
  }

  document.getElementById("answerResult").classList.toggle("h1");
  document.getElementById("answerResult").style.color = "rgb(255, 255, 255)";
  document.getElementById("answerResult").innerHTML = "Parabéns! Terminaste o jogo!";
  document.getElementById("explain").innerHTML = "Acertaste " + correctCount + " em " + currentQ.count + " perguntas \n e a tua pontuação é " + score + "!";
}

//level selection
function levelSelect() { 
  var slider = [document.getElementById("sliderEasy"), document.getElementById("sliderMed"), document.getElementById("sliderHard")];
  var output = [document.getElementById("textEasy"), document.getElementById("textMed"), document.getElementById("textHard")];
  var total = 0;
  var missing = 0;
  
  function addTotal() {
    total = 0;
    for (i = 0; i < 3; i++) total += Number(slider[i].value);
  }

  function update(i) {
    output[i].innerHTML = slider[i].value;
    
    //update level array
    for (k = 0; k < 3; k++) {
      levelDist[k] = Number(slider[k].value);
    }
    
    //number of questions left to distribute
    addTotal();
    missing = 15 - total;
    for (j = 0; j < 3; j++) {
      slider[j].max = (missing + Number(slider[j].value)).toString();
    }
    
    //show button to proceed
    if (total == 15) {
      document.getElementById("btnLevel").style.visibility = "visible";
    } else {
      document.getElementById("btnLevel").style.visibility = "hidden";
    }
  }
  
  //update slider positions
  slider[0].oninput = function() {
    update(0);
  }
  slider[1].oninput = function() {
    update(1);
  }
  slider[2].oninput = function() {
    update(2);
  }  
}
