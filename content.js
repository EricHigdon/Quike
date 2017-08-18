// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	// If the received message has the expected format...
	if (msg.text === 'getWrikeMeta') {
		// Call the specified callback, passing
		// the web-page's DOM content as argument
		var response = {};
		document.querySelectorAll('meta[name^="wrike_"]').forEach(function(tag){
			var content = tag.getAttribute('content')
				tagName = tag.getAttribute('name').split('_')[1];
			response[tagName] = content;
		});
		if(!response.title)
			response.title = document.title;
		sendResponse(response);
	}
});
