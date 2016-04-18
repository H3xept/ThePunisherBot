
//Description
//Final survey is completed by assuming this question order:
//Yesterday accomplishments
//...

//Setup  -----
var SlackBot = require('slackbots');
var scheduler = require('node-schedule');
var client = require("./auth");

var bot = new SlackBot({
    token: token, 
    name: 'The Punisher'
});
//Var declaration
var users;
//var userChannel;
var usersQuestionIndex;
var questions;
var finalResults;

var botUsername = "The Punisher";
var botId;
var channelname = "bottesting";
// -------

//Helper group
function delendaVar()
{
	users = [];
	finalResults = {};
	usersQuestionIndex = {};
	userChannel = {};
}

function randomQuestionWithIndex(index)
{
	var rndNumber = Math.floor(Math.random() * (questions[index].length));
	return questions[index][rndNumber];
}

function userObjectWithId(id)
{
	for (var i = users._value.members.length - 1; i >= 0; i--) {
		if(users._value.members[i].id == id){
			return users._value.members[i];
		}
	}
	return undefined;
}

function removeUserWithUsername(username)
{
	var index = 0;
	for (var i = users._value.members.length - 1; i >= 0; i--) {
		if(users._value.members[i].name == username){
			users._value.members.splice(index,1);
			return;
		}
		index += 1;
	}
}
// -------

function initMainLoop()
{
	delendaVar();

	questions = [["Hey buddy! What did you accomplish yesterday?","Mornin' man, what did you do yesterday?","Hey pal, what were you up to yesterday?"]];

	//Question all members randomy choosing time between 09:00 and 10:00
	var randomMinutes = Math.floor(Math.random() * (59 - 1) + 1);
	var cronString = randomMinutes.toString()+' 9 * * *';
	scheduler.scheduleJob(cronString,function(){
		punishUncomplete();
	});	

}

function punishUncomplete()
{
	//Temporary
	var shameString = "";

	if(users._value != undefined)
	{
		if(users._value.members.length == 0)
		{
			bot.postMessageToChannel(channelname,"Everybody answered!");
			return;
		}

		for (var i = users._value.members.length - 1; i >= 0; i--) 
		{
			shameString += " @"+users._value.members[i].name;
		}

		shameString += "\n You didn't answer or complete the daily survey. You are bad and you should feel bad.";
		bot.postMessageToChannel(channelname,shameString);
	}


	//Temporary
	delendaVar();
	emitQuestions();
}

function emitQuestions()
{

	users = bot.getUsers();
	users.then(function(usrArray){

		for (var i = 0; i < usrArray.members.length; i++) 
		{
			if(finalResults == undefined)
			{
				finalResults = {};
			} 
			
			var member = usrArray.members[i];
			usersQuestionIndex[member.name] = 0;

			if(finalResults[member.name] == undefined)
			{
				finalResults[member.name] = [];
			}

			finalResults[member.name].push([emitQuestion(0,member), "You are bad and you should feel bad."]);

		}
	});
}


function emitQuestion(index, member)
{
	var question = randomQuestionWithIndex(index);
	bot.postMessageToUser(member.name, question);
	return question;
}

function completeSurveyForUser(username)
{
	var surveyString = "Daily survey for @"+username+" has been completed.\n>>>";
	for (var i = 0; i < finalResults[username].length; i++) {
		surveyString += "_"+finalResults[username][i][0]+"_\n>"+finalResults[username][i][1]+"\n";
	}
	bot.postMessageToChannel(channelname,surveyString);
}

//Event handling

bot.on('start', function() {
	initMainLoop();
});


bot.on('message', function(data) {
	if(data.type == "message" && data.channel.substring(0,1) != "C") //Message from user
	{
		if(data.subtype != undefined)
		{
			if(data.subtype == "bot_message" && data.username == botUsername)
			{
				botId = data.bot_id;
			}
		}
		else //Message from user
		{
			var username = userObjectWithId(data.user).name;

			if(usersQuestionIndex[username] >= questions.length)
			{
				bot.postMessageToUser(username, "Shut up. See you tomorrow.");
				return;
			}

			var questionArray = finalResults[username][usersQuestionIndex[username]];
			questionArray[questionArray.length - 1] = data.text;
			
			//console.log(finalResults);

			console.log(finalResults[username]);
			if(++usersQuestionIndex[username] < questions.length)
			{	
				finalResults[username].push([emitQuestion(usersQuestionIndex[username],userObjectWithId(data.user)), "You are bad and you should feel bad."]);	
				return;
			}
			
			bot.postMessageToUser(username,"Thank you buddy! See you tomorrow.");
			removeUserWithUsername(username);
			completeSurveyForUser(username);
			
		}
	}

});



