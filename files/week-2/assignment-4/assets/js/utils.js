var utils = {
	// converts nodelist to array
	convertToArray: function(arr) {
		return Array.prototype.slice.call(arr);
	},

	// clears an ul / ol
	clearList: function(list) {
		while (list.firstChild) {
			list.removeChild(list.firstChild);
		}
	},

	// clears input and feedback
	resetInput: function() {
		input.value = "";
		input.focus();
		feedback.textContent = "";
		feedback.className = "";
	},

	feedback: function(msg, state) {
		feedback.innerHTML = msg;
		feedback.className = state;
	}
};