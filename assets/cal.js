function prettyPrint(date) {
	const when = new Date(date);

	const month = when.toLocaleString("en-US", { month: "long" });
	const day = when.getDate();
	const year = when.getFullYear();

	const suffix =
		day % 10 === 1 && day !== 11 ? "st" :
		day % 10 === 2 && day !== 12 ? "nd" :
		day % 10 === 3 && day !== 13 ? "rd" :
		"th";

	return `${month} ${day}${suffix} ${year}`;
}

function getMapDirections(location) {
	if ((navigator.platform.indexOf("iPhone") != -1) ||
	(navigator.platform.indexOf("iPad") != -1) ||
	(navigator.platform.indexOf("iPod") != -1)) {
		window.open("maps://maps.google.com/maps/dir//"+ encodeURI(location), 'gigmatch-directions');
	} else {
    	window.open("https://maps.google.com/maps/dir//"+ encodeURI(location), 'gigmatch-directions');
	}
}

function getEvents(el, id) {
	var id = id || `c_9f5ddadfef3ca6cdb4677bf1617ffdc84f7aadb24ebe264195e8c0a1155050ad@group.calendar.google.com`;
	let key = `AIzaSyCDoa1zVRXmMfdfnDHXkEy_3MLHJUSfrks`;
	let RFC3339 = new Date().toISOString();

	let gcal = `https://www.googleapis.com/calendar/v3/calendars/${id}/events?key=${key}&singleEvents=true&orderBy=startTime&timeMin=${RFC3339}`;

	fetch(gcal).then(response => {
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		return response.json(); // Parse JSON
	}).then(data => {
		let events = {};
		data.items.forEach((event) => {
			start = new Date(event.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
			end = new Date(event.end.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
			where = event.location.split(",").map(s => s.trim());
			events[event.start.dateTime.slice(0, 10)] = {
				name: event.summary,
				location: event.location,
				address: where.slice(1).join(", ").replace(", ", "<br/>"),
				start: start,
				end: end
			};
		});
		upcoming(el, events)
	}).catch(error => {
		console.error('Error fetching JSON:', error);
	});
}

function upcoming(el, events) {
	console.log('Events:', events);
	if (Object.keys(events).length == 0) { return; }

	const container = document.getElementById(el);
	const today = new Date();

	// Find the Sunday of the current week
	const start = new Date(today);
	start.setDate(today.getDate() - today.getDay());

	const totalDays = 7 * 4;
	const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	container.innerHTML = `
		<div class="calendar-headers">
		${weekdays.map(d => `<div>${d}</div>`).join("")}
		</div>
		<div class="calendar-grid"></div>
	`;

	const grid = container.querySelector(".calendar-grid");
	const dialog = document.getElementById("event-dialog");
	const dialogBody = document.getElementById("dialog-body");

	dialog.addEventListener('click', (e) => {
		e.stopPropagation()
		if (e.target.id !== 'dialog-body') {
			dialog.close();
		}
	});

	for (let i = 0; i < totalDays; i++) {
		const date = new Date(start);
		date.setDate(start.getDate() + i);

		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");

		const cell = document.createElement("div");
		cell.className = "calendar-day";

		// Highlight today
		if (date < today) {
			cell.classList.add("past");
		}
		if (date.toDateString() === today.toDateString()) {
			cell.classList.add("today");
		}
		if (date.getMonth() !== today.getMonth()) {
			cell.classList.add("alt");
		}

		let event = events[`${y}-${m}-${d}`];

		// Event day
		if (event) {
			cell.classList.add("event");
			cell.data = event;
		}

		cell.textContent = d;

		// Click handler for dialog
		cell.addEventListener("click", () => {
			if (cell.data && cell.data.name) {
				let when = prettyPrint(cell.data.start);
				dialogBody.innerHTML = `
				<h3 class="modal-name">${cell.data.name}</h3>
				<p class="modal-date">${when} &bull; <span class="time">${cell.data.start} &ndash; ${cell.data.end}</span></p>
				`;
				let a = document.createElement('a');
				a.className = 'modal-addr';
				a.title = `Get Directions to ${cell.data.location.split(",")[0]}`;
				a.href = "javascript:void('getDirections');";
				a.innerHTML = '';
				a.innerHTML += `<span>${cell.data.location.split(",")[0]}<br/>${cell.data.address}</span>`;
				a.innerHTML += `<i class="fa-solid fa-diamond-turn-right"></i>`;
				a.addEventListener("click", function() {
					getMapDirections(cell.data.location);
				});

				dialogBody.appendChild(a);

				dialog.showModal();
				dialog.focus();
			}
		});

		grid.appendChild(cell);
	}
}
