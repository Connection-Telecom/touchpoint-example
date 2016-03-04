
;(function () {

var websocketPath = site.replace(/https:/, "wss:") + "/websocket";
var ddp = new MeteorDdp(websocketPath);
var chatId = null;
var closed = false;

function scrollToBottom() {
	var chatView = $(".chat-view")[0];
	chatView.scrollTop = chatView.scrollHeight;
}

$(function () {
	if (typeof WebSocket === "undefined") {
		$(".status").text("Sorry, your browser is not supported. Please update to a more recent browser.");
	} else {
		startChat();
	}
});

function startChat() {
	$(".enter-topic-mode").addClass("hidden");
	$(".chat-mode").removeClass("hidden");

	ddp.connect().then(function () {
		return ddp.call("createChat", [customerId, topic, team, contextToken]);

	}).then(function (_chatId) {
		chatId = _chatId;

		ddp.watch("chats", function (chat, eventType) {
			if (chat.agentId != null) {
				foundAgent = true;
				$(".status").addClass("hidden");
			} else {
				$(".status").text("Waiting for an agent...").removeClass("hidden");
				scrollToBottom();
			}
			if (chat.agentIsTyping) {
				$(".agent-typing").removeClass("hidden");
				scrollToBottom();
			} else {
				$(".agent-typing").addClass("hidden");
			}
			if (chat.isClosed) {
				$(".text-entry-wrapper").remove();
				$(".send-btn").remove();
				scrollToBottom();
				ddp.close();
			}
		});

		ddp.watch("messages", function (message, eventType) {
			if (eventType === "added") {
				if (message.type === "agentMsg") {
					$(".agent-typing").addClass("hidden");
					$('<p class="chat-message chat-message-agent">').text(message.message).insertBefore(".insertion-point");
				} else {
					if (message.type === "claim") {
						$(".status").addClass("hidden");
					}
					$('<p class="chat-note">').text(message.message).insertBefore(".insertion-point");
				}
				scrollToBottom();
			}
		});

		return ddp.subscribe("userChat", [chatId]);

	}).then(function () {
		var userIsTyping = false;
		var timeout = null;

		function sendMessage() {
			var text = $(".text-entry").val().trim();
			$(".text-entry").val("").focus();
			if (text === "") return;
			if (text.length > 4096) {
				text = text.slice(0, 4096);
			}

			var element = $('<p class="chat-message chat-message-user">').text(text);
			element.insertBefore(".insertion-point");
			scrollToBottom();

			userIsTyping = false;
			ddp.call("postMessageAsUser", [chatId, text]).done(function (result) {
				if (result != null) {
					element.text(result);
				}
			}).fail(function (err) {
				console.log(err);
				element.remove();
			});
		}

		$(".text-entry").focus().on("keypress", function (evt) {
			if (evt.which === 13) { // enter
				sendMessage();
			}
		});

		$(".send-btn").on("click", sendMessage);

		function timeoutExpired() {
			if (userIsTyping) {
				userIsTyping = false;
				ddp.call("setUserIsTyping", [chatId, false]).fail(function (err) {
					console.log(err);
				});
			}
		}
		$(".text-entry").on("input change", function (evt) {
			if (timeout != null) {
				clearTimeout(timeout);
				timeout = null;
			}

			var text = $(".text-entry").val().trim();
			if (text !== "") {
				if (!userIsTyping) {
					userIsTyping = true;
					ddp.call("setUserIsTyping", [chatId, true]).fail(function (err) {
						console.log(err);
					});
				}
				timeout = setTimeout(timeoutExpired, 10000);

			} else if (text === "" && userIsTyping) {
				userIsTyping = false;
				ddp.call("setUserIsTyping", [chatId, false]).fail(function (err) {
					console.log(err);
				});
			}
		});

	}).fail(function (err) {
		console.log(err);
		$('<p class="chat-note">An error occurred.</p>').insertBefore(".insertion-point");
		scrollToBottom();
	});

}

})();
