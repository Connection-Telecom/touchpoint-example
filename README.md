
# Touchpoint example

This is an example of integrating a site with Touchpoint.

Some preset topics are defined in `config.json` and each is associated with
a team. After the user chooses a topic, the server checks if the associated
team is available. If it is, the chat is sent to that team, and if it isn't,
it is sent to the `default` team.

If the `default` team is not available, it will display an email form instead
of offering live chat.

## Running

```sh
# Install dependencies
npm install

# Run
node server.js
```

## Configuration

Configuration is in `config.json`:

* `site` should be `https://touchpoint.telviva.com` without a trailing `/`.
* `customerId` is the ID of the Touchpoint customer to use. You can find
  this by logging in on Touchpoint and typing `Meteor.user().customerId` in the
  console.
* `port` is the port to listen on
* `topics`: for example,

```json
[
	{"name": "priceq", "topic": "I have a question about prices", "team": "Sales"},
	{"name": "salesq", "topic": "I have a general sales question", "team": "Sales"},
	{"name": "newhelp", "topic": "I'm a new customer who needs help", "team": "On-boarding"},
	{"name": "login", "topic": "I can't log in", "team": "Support"},
	{"name": "post", "topic": "I'm having problems posting", "team": "Support"},
	{"name": "supportq", "topic": "I have some other issue", "team": "Support"}
]
```

* The `name`s are arbitrary identifiers (but they must be unique) and the `team`s should
  match the name of a team configured in Touchpoint.
* `userId` and `authToken` are the credentials of an admin user in your customer. You can
  get these by running:

```sh
curl https://touchpoint.telviva.com/api/login -d "email=youremail@example.com&password=yourpassword"
```