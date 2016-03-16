
var express = require("express");
var request = require("request");
var consolidate = require("consolidate");
var bodyParser = require("body-parser");
var _ = require("underscore");
var config = require("./config.json");

var app = express();
app.engine("html", consolidate.handlebars);
app.set("view engine", "html");
app.set("views", __dirname + "/views");

var urlencoded = bodyParser.urlencoded({extended: false});

function escapeForScriptTag(value) {
	return JSON.stringify(JSON.stringify(value)).replace(/<\//g, "<\\/");
}

app.use(express.static(__dirname + "/public"));

app.get("/contact", function (req, res) {
	// Check if there are agents available in the "default" team.
	// If there are, show the form for live chat.
	// Otherwise show the regular contact form.
	request(config.site + "/api/customers/" + config.customerId + "/available?team=default", function (error, response, body) {
		if (error || response.statusCode !== 200) {
			res.render("error");
		} else if (JSON.parse(body) === true) {
			res.render("livechat-form", {topics: config.topics});
		} else {
			res.render("contact-form");
		}
	});
});

app.post("/chat", urlencoded, function (req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var topic = req.body.topic;
	topic = _.findWhere(config.topics, {name: topic});

	if (name == null || email == null || topic == null) {
		res.send("Please fill in all fields with valid values");
		return;
	}

	if (topic.team !== "default") {
		// Check if the team this topic is assigned to is currently available. If
		// it isn't then we will send the user to the "default" team.
		request(config.site + "/api/customers/" + config.customerId + "/available?team=" + encodeURIComponent(topic.team), teamAvailableCallback);
	} else {
		teamAvailableCallback(null, {statusCode: 200}, "true");
	}

	var team;

	function teamAvailableCallback(error, response, body) {
		if (error || response.statusCode !== 200) {
			res.render("error");
			return;
		}
		team = (JSON.parse(body) === true) ? topic.team : "default";

		// Send the context for the chat to Touchpoint.
		// Here the name and email are set by the user. The user could of course be lying about who they are.
		// If our existing site has some authentication, we would probably want to apply it here.
		request({
			url: config.site + "/api/context",
			method: "POST",
			headers: {
				"X-User-Id": config.userId,
				"X-Auth-Token": config.authToken
			},
			json: true,
			body: {
				name: name,
				notes: "User provided email: \"" + email + "\"",
				custom: { email: email }
			}
		}, sendContextCallback);
	}

	function sendContextCallback(error, response, body) {
		if (error || response.statusCode !== 200) {
			res.render("error");
			return;
		}
		res.render("chat", {
			site: escapeForScriptTag(config.site),
			customerId: escapeForScriptTag(config.customerId),
			topic: escapeForScriptTag(topic.shortTopic || topic.topic),
			team: escapeForScriptTag(team),
			contextToken: escapeForScriptTag(body)
		})
	}
});

app.listen(config.port);