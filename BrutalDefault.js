//BrutalDefault - a LWG AI created by Brutalitywarlord
//This Variant of the Ai works only for default maps
//Its behavior can vary by slight margins dependant on modifiers determined from the start of the gameclock
//As a result of increased dependancy on RNG - this bot is more versatile, and variable in its behavior
//Than the current default AI for LWG - although this current iteration still struggles to defeat the current model.



//Initialization scope - sets variables for use in behavioural augmentations
if(!scope.initialized){
	//generates a randomized multiplier to determine variable behavior in the computer
	scope.aggression = 1 + (1/randBehavior(10, true));//Controls the interval for aggresive actions
	scope.frugal = 1 + (1/randBehavior(20));//Controls how much money the Computer wants to save
	scope.intel = 1 + (1/randBehavior(10, true));//Controls the interval for scouting actions
	scope.exspansion = 1 + (1/randBehavior(10, true));//Controls the interval for most building construction
	scope.defensive = 1 + (1/randBehavior(10, true));//Controls interval for defensive actions
	scope.rshPrio = 1 - (1/randBehavior(10));//Controls how often the computer will research new technology
	scope.playNum = scope.getArrayOfPlayerNumbers();
	scope.playStarts = [];
	for (var yee = 0; yee < scope.playNum.length; yee++){
		scope.playStarts[yee] = scope.getStartLocationForPlayerNumber(scope.playNum[yee]);
	}
	scope.plentyGold = false;
	
	//Logs all the behavioral variables in the console.
	console.log("Strategy: ", scope.strategy);
	console.log("Aggression: ", scope.aggression);
	console.log("Frugal: ", scope.frugal);
	console.log("Intel: ", scope.intel);
	console.log("Exspansion: ", scope.exspansion);
	console.log("Defensive: ", scope.defensive);
	console.log("Research Priority: ", scope.rshPrio);
	console.log("------------------");
	
	scope.initialized = true;
}



// General variables
var time = Math.round(scope.getCurrentGameTimeInSec());
var me = scope.getMyPlayerNumber();
var myTeam = scope.getMyTeamNumber();
var gold = scope.getGold();
var mines = EmptyFilter();
var Width = scope.getMapWidth();
var Height = scope.getMapHeight();
var supply = scope.getCurrentSupply();
var maxSup = scope.getMaxSupply;
var supDiff = maxSup - supply;




//variables to store allied Buildings
var allBuild = scope.getBuildings({player: me, onlyFinished: true})
var castles = scope.getBuildings({type: "Castle", player: me, onlyFinished: true});
var houses = scope.getBuildings({type: "House", player: me, onlyFinished: true});
var towers = scope.getBuildings({type: "Watchtower", player: me, onlyFinished: true});
var Rax = scope.getBuildings({type: "Barracks", player: me, onlyFinished: true});
var forges = scope.getBuildings({type: "Forge", player: me, onlyFinished: true});
var impStruct = castles.concat(houses.concat(towers.concat(Rax)))
var allAllied = scanFriendly();

//Variables to locate Computer owned units
var idleWorkers = scope.getUnits({type: "Worker", player: me, order: "Stop"});
var workers = scope.getUnits({type: "Worker", player: me});
var Soldier = scope.getUnits({type: "Soldier", player: me});
var Archer = scope.getUnits({type: "Archer", player: me});
var Army = Soldier.concat(Archer);
var birbs = scope.getUnits({type: "Bird", player: me});

//Variables to store arrays of enemy objects
var enemyUnits = scope.getUnits({enemyOf: me});
var enemyBuildings = scope.getBuildings({enemyOf: me});
var Goldmines = scope.getBuildings({type: "Goldmine"});

//Variables to control action ticks
var mineDelay = false;
var scout = false;
var isBattle = false;
var isSiege = false;
var towerBuild = false;
var workerCheck = false;
var repCheck = false;
var houseCheck = false;
var castleCheck = false;
var upgCheck = false;
var raxCheck = false;
var armyCheck = false;
var birbCheck = false;
var forgeCheck = false;

//Sets the tickrate for each action the computer can do
mineDelay = DecisionTick(3);
scout = DecisionTick(Math.floor(60*scope.intel));
isBattle = DecisionTick(Math.floor(20*scope.defensive));
isSiege = DecisionTick(Math.floor(180*scope.aggression));
towerBuild = DecisionTick(Math.floor(50*scope.exspansion));
workerCheck = DecisionTick(25);
repCheck = DecisionTick(Math.floor(10*scope.defensive));
houseCheck = DecisionTick(Math.floor(30*scope.exspansion));
raxCheck = DecisionTick(Math.floor(20*scope.exspansion));
armyCheck = DecisionTick(5);
upgCheck = DecisionTick(Math.floor((120*scope.frugal)*scope.rshPrio));
birbCheck = DecisionTick(60);
forgeCheck = DecisionTick(Math.floor(60*scope.exspansion));
var minecheck = DecisionTick(60);

if(castles.length < 2 && time > 60){
	//If there is less than two castles, tickrate is modified to give an extreme priority...
	//for constructing the second castle
	castleCheck = DecisionTick(5);
}
else{
	//After a second castle is built, tickrate is modified to give less priority to building castles
	castleCheck = DecisionTick(180 * scope.exspansion);
}

//gives a mining command to any idle workers
if (mineDelay == true){
	startMine();
}
//If the computer has less than 2 birds, it builds new birds.
if(birbCheck == true && birbs.length < 1 && castles.length > 1 && scope.plentyGold == false){
	//If there's few goldmines near the castle from the start, don't make a bird until two castles exist
	TrainUnit(castles, "Train Bird");
}
if(birbCheck == true && birbs.length < 1 && time > 300 && scope.plentyGold == true){
	//If there's plenty of goldmines near the castle, make a bird regardless of number of castles
	TrainUnit(castles, "Train Bird");
}

//Commands small army to move to random location
if (scout == true){
	if(birbs.length > 0 && time > 450){
		//If a bird exists, use it for scouting
		Scout(Width,Height,birbs, false);
	}
	else{
		//If a bird doesn't exist, use a basic soldier instead - if one exists
		if(time > 600 && Army.length > 0){
			var scouter = [];//Empty array to store the first unit in the array of units
			scouter.push(Army[0]);
			Scout(Width,Height, scouter, false);
		}
	}
	
}

//If the enemy is close to one of the computers buildings, send units to intercept.
if(isBattle == true){
	if(enemyUnits.length > 0 && allAllied.length > 0 && Army.length >= enemyUnits.length) {
		var e = enemyUnits[Random(0,enemyUnits.length)]; //Only checks one enemy to prevent lag
		for(var i = 0; i < allAllied.length; i++){
			//For loop cycles through an array of all specified buildings
			var b = allAllied[i];
			var dist = GetDist(b, e);//Gets the hypotenouse between allied structure, and enemy
			if(dist < 17*scope.defensive){
				//If an enemy unit is within the defensive threshold - deploy army to intercept
				scope.order("AMove", Army, {x: e.getX(),y: e.getY()});
				defenseQuips();
				i = allAllied.length;
			}
		}
		
		
	}
}
//Declares an attack against a random enemy building 
if(isSiege == true && (castles.length > 1 || scope.plentyGold == true)){
	if(Army.length > 10){
		//If the computer has at least 10 soldiers, and knows the enemies location...
		//Attack the enemy
		Seige(enemyBuildings, Army);
	}
}
//If Comptuers worker count is too small - make more workers
if (workerCheck == true && time > 40){
	if (workers.length < 10){
		//Maintains a supply of 10 workers at all times
		TrainUnit(castles,"Train Worker");
	}
	if (workers.length < 7 * castles.length){
		//Will maintain a supply 7 workers per castle built
		//This only really takes effect after a second castle has been built
		TrainUnit(castles,"Train Worker");
	}
}

//Worker Commands
if (workers.length > 0){
	//Locates a nearby goldmine, then orders the construction of a new castle near it
	if (castleCheck == true && scope.plentyGold == false){
		newCastle();
	}
	//Deploys a worker to produce a Barracks - Formula: 2 barracks per castle built.
	if (raxCheck == true && (Rax.length < castles.length*2)){
		RandBuild("Barracks","Build Barracks", workers, 3, castles, 10);
	}
	//Deploys a worker to construct a Forge
	if(forgeCheck == true && forges.length < 1 && (time > 450 || scope.plentyGold == true)){
		RandBuild("Forge","Build Forge", workers, 3, castles, 15);
		//After the in-game clock has reached 10 minutes, construct a Forge if possible
	}
	//Deploys a worker to produce a House
	if(houseCheck == true && time > 10 ){
		//Will initially construct 1 house, then will proceed to build 2 houses for each barracks built
		if (houses.length < 1 || houses.length < (Rax.length*2) || scope.plentyGold == true ){
			RandBuild("House","Build House", workers, 3, castles, 12, 7);
		}
	}
	//Deploys a worker to construct a watchtower
	if (towerBuild == true && Rax.length > 1 && castles.length < 2 && towers.length < 1 && scope.plentyGold == false){
		RandBuild("Watchtower","Build Watchtower", workers, 2, impStruct, 10,3);
		//This statement will only run if there is a Barracks built, and there is less than 2 castles
	}
	if ((towerBuild == true  && castles.length > 1) || (towerBuild == true  && scope.plentyGold == true)){
		RandBuild("Watchtower","Build Watchtower", workers, 2, impStruct, 10,3);
		//If there is more than 1 castle, or the map has an excess of gold nearby the starting castle, 
		//Freely build towers when possible during a set interval. 
	}

	//Deploys a worker to repair a damaged building
	if (repCheck == true && time > 10){
		if(allBuild.length > 0){
			Repair(allBuild, workers);
		}
	}

	
}
else {
	TrainUnit(castles,"Worker")
}

if (armyCheck == true){
	var choice = Random(0,100);//Generates a random number to act as a method of choosing a unit to build
	if (choice < 40){
		//Trains an Archer 35% of the time
		TrainUnit(Rax, "Train Archer");
	}
	else{
		//Trains an Soldier 65% of the time
		TrainUnit(Rax, "Train Soldier");
	}
	
}

if(upgCheck == true && forges.length > 0){
	if (scope.plentyGold ==true){
		//If there is an excess of gold nearby the start location, freely research upgrades
		unitUpg();
	}
	else{
		//If there is not an excess of gold nearby the start location, wait until a second castle exists
		if (castles.length > 1){
			unitUpg();
		}
	}
	
}

if (minecheck == true){
	plentiGold();
}


//Lower Section dictates functions which build the primary decision core
//-----------------------------------------------------------------------
//Finds the closest mine, then orders workers to mine it
function startMine(){
	var nearestDist = 99999;
	var closeMines = [];
	var selectedMine = null;
	var d = castles[Random(0, castles.length)];
	if(castles.length > 0)
	{
		
		for(var i = 0; i < mines.length; i++)
		{
			// get nearest goldmine
			var mine = mines[i];
			var dist = GetDist(d, mine);
			if(dist < nearestDist)
			{
				nearestDist = dist;
			}
		}
		for(var i = 0; i < mines.length; i++){
			//If the mine is within a certain distance add it to the possible selection of mines
			var mine = mines[i];
			var distance = GetDist(d, mine);
			if(distance < (nearestDist + ((4*scope.frugal))) 
			&& distance > (nearestDist - ((4*scope.frugal)))){
				closeMines.push(mine);
			}
		}
	}
	var idle = [];
	for(var b = 0; b < idleWorkers.length; b++){
		if (idleWorkers[b].getCurrentOrderName() != "Repair"){
			idle[0] = idleWorkers[b];
		}
		selectedMine = closeMines[Random(0, closeMines.length)];
		scope.order("Mine", idle, {unit: selectedMine});
	}
}

//Filters mine arrays so Computer will not attempt mining when no gold remains
function EmptyFilter(){
	//Variables to import gold mine arrays
	var Gold = scope.getBuildings({type: "Goldmine"});
	var mines = Gold;
	//Filters Mines to determine if Gold is remaining
	var newMines = mines.filter(m => m.getValue('gold') > 0);
	return newMines;
}

//Function which determines tickrate for certain actions based on gameclock
function DecisionTick(rate){
	var t = time;
	var r = Math.floor(rate + 0.01);
	//determines if the time is perfectly divisable by the rate
	var i = t % r == 0;
	return i;
	console.log("Variable: ", i);
}

//Deploys a scout to investigate the map
function Scout(width,height, unit,squad){
	var w = width; //gets map width
	var sq = squad//Boolean value, set equal to "true" to have the command deploy a squad.
	var h = height; //gets map height
	var m = unit; //Imports array of units to be selected from
	var s = []; // Empty array  - will be filled
	var r = 0;;//Selects a random index.
	//Grabs the start location of a random player
	var enemyLoc = scope.getStartLocationForPlayerNumber(scope.playNum[Random(0, scope.playNum.length)]);
	//Sorts out neutrals from enemy buildings array
	var trueEnemy = [];
	for(i = 0; i < enemyBuildings.length; i++){
		if(enemyBuildings[i].isNeutral() == false){
			trueEnemy.push(enemyBuildings[i]);
		}
	}
	if(time < 600 && trueEnemy.length < 1){
		//If the game is within the first 10 minutes, scout a random player's start location
		if (sq == false){
			//if Squad is set to false, deploy only a single unit
			r = Random(0, m.length)
			s.push(m[r]);
			scope.order("AMove",s,enemyLoc,{shift: true});
		}
		else{
			if (m.length > 4){
				var i = 0;
				while (i < 5){
					r = Random(0, m.length);
					//Add random unit to array of selected units
					s.push(m[r]);
					i = i + 1;
				}
			}
			//Orders units tomove to random location
			scope.order("AMove",s, enemyLoc);
		}
	}
	else{
		//If its beyond the first 10 minutes, scout around the map randomly
		//Selects a random cordinate within the map.
		var X = Random(0, w);
		var Y = Random(0, h);
		if (sq == false){
			//if Squad is set to false, deploy only a single unit
			r = Random(0, m.length)
			s.push(m[r]);
			scope.order("AMove",s,{x: X,y: Y},{shift: true});
		}
		else{
			if (m.length > 4){
				var i = 0;
				while (i < 5){
					r = Random(0, m.length);
					//Add random unit to array of selected units
					s.push(m[r]);
					i = i + 1;
				}
			}
			//Orders units tomove to random location
			scope.order("AMove",s,{x: X,y: Y});
		}
	}
	
}

//Random Number Function - Note: Selection range begins at 0, and ends at max - 1
function Random(min, max){
    return Math.floor(scope.getRandomNumber(min, max));
}

//same as Random, but also decides if number is positive or negative
function PosNeg(mini, maxi){
	var n = Random(mini, maxi);
	var Decision = Random(0, 2);
	if (Decision != 0 ){
		n = n*1;
	}
	else{
		n = n* -1;
	}
	return n;
}


//Generalized function for training units
function TrainUnit(building,unitTag){
	var b = building; //Array of buildings which trains specified unit
	var unit = unitTag; //String Value for command to build desired unit
	for (i = 0; i < b.length; i++){
		//for every building - train unit of type unitTag
		if(b.length >= 1 && !b[i].getUnitTypeNameInProductionQueAt(1)){
			scope.order(unit, [b[i]]);
		}
	}

}

//Function designed to spam production of units
function SpamUnit(building,unitTag){
	var b = building; //Array of buildings which trains specified unit
	var unit = unitTag; //String Value for command to build desired unit
	for (i = 0; i < b.length; i++){
		//for every building - train unit of type unitTag
		if(b.length >= 1 && !b[i].getUnitTypeNameInProductionQueAt(1)){
			var n = 0;
			while(n < 6){
				scope.order(unit, [b[i]]);
				n = n+1;
			}
		}
	}

}

//orders a worker to repair any damaged buildings
//Build is an array variable that stores buildings to be checked for repairs
function Repair(Build, Units){
	var n = Build.length;
	var U = [];
	var c = 0;//Variable controls loop to prevent infinite recursion
	let selectedWorker;
	do {
		let i = Random(0, Units.length);
		
		if (Units[i].getCurrentOrderName() == "Mine" 
		|| Units[i].getCurrentOrderName() =="Stop"){
			selectedWorker = Units[i];
			
		}
		c = c+1;
	} while (c < 20);
	U.push(selectedWorker)
	if (U[0] == null){
		U[0] = Units[0];
	}

	scope.order("Stop", U);
	for (var i = 0; i < n; i++){		
		var H = Build[i];//selects a friendly building to be scanned
		var bHP = H.getFieldValue("hp");//gets base HP for building type
		//scans if the HP is less than the maximum
		//removes buildings under construction
		if (H.getValue("hp") < bHP && H.isUnderConstruction() == false 
		){
			scope.order("Repair", U, {unit: H}, {shift: true});
		}		
	}

}

//Constructs a building at a random location in a radius around a parent object. 
function RandBuild(building, command, Unit, size, Parent, Radius , Mod){
		var b = building; //String Value of Building Name
		var r = Radius;//Sets the max distance from the parent the building can be constructed.
		var m = Mod;//Defines the minimum distance a building can be constructed - useful for goldmines
		var c = command; //String value of build command
		var u = Unit; //Imports Array of Units which can build the target structure
		var si = size; //Size of building structure- Integer Value
		
		var p = null;//Stores the array of parent objects
		
		if (!Parent || Parent.length == 0){
			//Do nothing
		}
		else{
			//Assign a random Parent Object
			p = Parent[Random(0, Parent.length)];
		}
		var n = Random(0, u.length) ;//Aquires random index
		var s = [];
		var check = [];
		var Cost = scope.getTypeFieldValue(b,"cost")*scope.frugal;//Aquires cost of building
		if (n < 0 || n >= u.length){
			//If Index is not defined - assign the first index to prevent error
			s[0] = u[0];
		}
		else{
			//If Index is defined, assign the random Index
			s[0] = u[n];
		}
		//Makes sure m is not undefined
		if(!Mod){
			//If Mod is undefined, set 'm' = 0 to prevent errors
			m = 0;
		}
		//Makes sure r is not undefined
		if(!Radius){
			//if Radius is not defined, just set 'r' equal to 1 to prevent errors
			r = 1;
		}
		var order = s[0].getCurrentOrderName();//Gets current order for selected unit

		//Filters out builders who are building other structures
		if(order == "Stop" || order == "Mine" && s.length > 0 && u.length > 0){
			var b = 0;

			//Attempts to find a valid location 10 times
			while (b < 10){
				//Aquires Random Coordinates
				var X;
				var Y;
				if(!Parent || Parent.length == 0){
					//If Parent is undefined or empty, build at a completely random position on map
					//To build at a completely random location, user may intentionally leave the 
					//Parent modifier empty while calling the function
					//If Parent is undefined, a radius modifier will also not be added
					X = Random(0, Width);
					Y = Random(0, Height);
				}
				else{
					var g = 0;
					while (g == 0){
						//Assigns new coordinates if existing ones are invalid
						//Grabs the coordinates of the parent object 'p'
						//Adds a randomly generated number within the radius 'r' to the existing coordinate
						//Modifier 'm' serves as an inner radius to prevent construction within its boundary
						//If user intends no inner radius, you can leave Mod parameter blank when calling function
						X = p.getX() + PosNeg(0, r);
						Y = p.getY() + PosNeg(0, r);
						//Following code checks if the new coordinate is too close to the structure
						if (r > 0){
							if ( (X <= si + m || X > Width) || (Y <= si + m || Y > Height)){
								g = 0;
							}
							else{
								g = 1;
							}
						}
						else{
							if ( (X <= si - m || X > Width) || (Y <= si - m || Y > Height)){
								g = 0;
							}
							else{
								g = 1;
							}
						}
						
						
					}
				}
				//This part of the code determines if the structure can actually be built
				if(gold >= Cost){
					//scans the provided coordinates to determine if position is valid.
					var check = false;
					for(var i = 0; i < si; i++){
						for(var z = 0; z < si; z++){
							if (scope.positionIsPathable(X + i, Y + z) == false){
								//if position is invalid, check is false
								check = false;
								z = si;
								i = si;
								
							}
							else{
								check = true;
							}
						}			
					}
					
					if (check == true){
						//if position is valid, check is true, and an order is issued to build at location
						//Code then breaks the overarching while loop to prevent infinite run time
						scope.order("Stop", s);//Stops current Order
						scope.order(c, s,{x: X ,y: Y});//Orders construction at random coordinates
						b = 10;//Exits While Loop
					}
				}
				b = b + 1;//Cycles While Loop and eventually ends it
			}
			
		}
}


//Selects a random upgrade for Militia unit
function unitUpg(){
	var r = Random(1, 2);
	
	if(r < 2){
		scope.order("Attack Upgrade", forges);
	}
	else{
		scope.order("Armor Upgrade", forges);
	}

}

//Attack a random building the enemy has spotted
function Seige(eBuild, army){
	var e = eBuild.length; //Imports array of Enemy Buildings
	var a = army; //Imports Array of Allied attack Units;
	var targ = [];
	for(i = 0; i < e; i++){
		if(eBuild[i].isNeutral() == false){
			targ.push(eBuild[i]);
		}
	}
	attackQuips();
	var t = targ[Random(0, targ.length)];
	if (!t){
	}
	else{
		scope.order("AMove", a ,{x: t.getX(), y: t.getY()});
	}
}

//Gets a specified parameter for a Unit type
function GetField(Unit,Field){
	var U = Unit
	var F = Field
	var Yeet = scope.getTypeFieldValue(U, F);
	return Yeet;
}

//A special random function which prevents zero from occuring
//Used only during initialization 
function randBehavior(m, pn){
	var n = 1;
	//check if the positive negative boolean is active
	if(!pn){
		//if number is intended to only be positive, use Random
		n = Random(1, m);
		if(n == 0 || n == 1){
			//Ensures the number is not an invalid number
			n = 2;
		}
	}
	else{
		//if number is intended to be either positive or negative , use PosNeg
		n = PosNeg(1, m);
		if(n == 0 || n == 1 || n == -1){
			//Ensures the number is not an invalid number
			n = 2;
		}
	}
	return n;
}

//Gets the distance between two objects
function GetDist(obj1, obj2){
		var X1 = obj1.getX();
		var X2 = obj2.getX();
		var Y1 = obj1.getY();
		var Y2 = obj2.getY();
		
		var X = X1 - X2;
		var Y = Y1 - Y2;
		//Calculates the Hypotenous of the triangle between two objects
		var H = Math.sqrt((X*X) + (Y*Y));	
		return H;
		
}
//If the closest mine to the castle is farther than 9 units - build another castle nearby
function newCastle(){
	var closeMines = [];//stores an array of mines that are close to the castle
	var d = castles[Random(0, castles.length)];
	var rad = 40*scope.exspansion;
	var sel = [];
	if(castles.length > 0)
	{
		//Cycle through all known active goldmines and find those within a certain distance of the castle.
		for(var g = 0; g < mines.length; g++){
			if (GetDist(d, mines[g]) < rad && GetDist(d, mines[g]) > 10){
				closeMines.push(mines[g]);
			}
		}
		if(closeMines.length > 0){
			sel[0] = closeMines[Random(0, closeMines.length)];
			RandBuild("Castle","Build Castle", workers, 4, sel, 11, 7);
		}
		else{
			RandBuild("Castle","Build Castle", workers, 4, mines, 11, 7);
		}
	}
}
//detects if there is enough gold nearby that the computer doesn't need to build a second castle
//will be useful for maps in a similar style to Diag 1v1 ect.
function plentiGold(){
	var closeMines = [];//stores an array of mines that are close to the castle
	var d = castles[Random(0, castles.length)];
	var rad = 9
	var sel = [];
	if(castles.length > 0)
	{
		//Cycle through all known active goldmines and find those within a certain distance of the castle.
		for(var g = 0; g < mines.length; g++){
			if (GetDist(d, mines[g]) < rad){
				//Checks if the gold mine is on the same elevation - if it is, add it to array
				if(scope.getHeightLevel(mines[g].getX(), mines[g].getY()) == scope.getHeightLevel(d.getX(), d.getY())){
					closeMines.push(mines[g]);
				}
			}
		}
		if(closeMines.length > 2){
			scope.plentyGold = true;
		}
		else{
			scope.plentyGold = false;
		}
	}
}

//Sends a preset message related to defense
function defenseQuips(){
	var choice = Random(0, 100);
	if(choice < 30){
		scope.chatMsg("Cowabunga it is");
	}
	if(choice > 29 && choice < 60 ){
		scope.chatMsg("Please go away");
	}
	if(choice > 59 ){
		scope.chatMsg("Hey >:( ");
		scope.chatMsg("Get away from my buildings!")
	}
}
//Sends a preset message related to Attack
function attackQuips(){
	var choice = Random(0, 100);
	var trueEnemy = [];
	for(i = 0; i < enemyBuildings.length; i++){
		if(enemyBuildings[i].isNeutral() == false){
			trueEnemy.push(enemyBuildings[i]);
		}
	}
	if (trueEnemy.length > 0){
		//used when the bot knows where a player building is located
		if(choice < 30){
			scope.chatMsg("I'm coming for you");
		}
		if(choice > 29 && choice < 60 ){
			scope.chatMsg("Maybe you should just surrender");
		}
		if(choice > 59 ){
			scope.chatMsg("I found you...");
		}
	}
	else{
		//used when no enemy buildings have been located
		if(choice < "30"){
			scope.chatMsg("You can't hide forever");
		}
		if(choice > 29 && choice < 60 ){
			scope.chatMsg("I'll find you...");
		}
		if(choice > 59 ){
			scope.chatMsg("You could make this easier for both of us if you just surrender");
		}
	}

}

//Scans an array of allied units and removes all of the neutral entities
function scanFriendly(){
	var trueAlly = [];
	var Allied = scope.getBuildings({enemyOf: !me, onlyFinished: true})
	for(i = 0; i < Allied.length; i++){
		if(Allied[i].isNeutral() == false){
			trueAlly.push(Allied[i]);
		}
	}
	return trueAlly;
}

