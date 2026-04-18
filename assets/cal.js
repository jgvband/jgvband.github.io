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
	if (id == "") { return; }
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
			const dayKey = event.start.dateTime.slice(0, 10); // "YYYY-MM-DD"
			where = event.location.split(",").map(s => s.trim());

			if (!events[dayKey]) {
				events[dayKey] = [];
			}

			events[dayKey].push({
				name: event.summary,
				location: event.location,
				address: where.slice(1).join(", ").replace(", ", "<br/>"),
				start: event.start.dateTime,
				end: event.end.dateTime
			});
		});
		upcoming(el, events)
	}).catch(error => {
		console.error('Error fetching JSON:', error);
	});
}

function month(el, events) {
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
			dialogBody.innerHTML = '';
			console.log(cell.data);
			if (cell.data && cell.data.length > 0) {
				for (const event of cell.data) {
					if (event.name) {
						let when = prettyPrint(event.start);
						let start = new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
						let end = new Date(event.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

						let div = document.createElement('div');
						div.innerHTML += `
						<h3 class="modal-name">${event.name}</h3>
						<p class="modal-date">${when} &bull; <span class="time">${start} &ndash; ${end}</span></p>
						`;
						let a = document.createElement('a');
						a.className = 'modal-addr';
						a.title = `Get Directions to ${event.location.split(",")[0]}`;
						a.href = "javascript:void('getDirections');";
						a.innerHTML = '';
						a.innerHTML += `<span>${event.location.split(",")[0]}<br/>${event.address}</span>`;
						a.innerHTML += `<i class="fa-solid fa-diamond-turn-right"></i>`;
						a.addEventListener("click", function() {
							getMapDirections(event.location);
						});

						div.appendChild(a);
						dialogBody.appendChild(div);

						dialog.showModal();
						dialog.focus();
					}
				}
			}
		});

		grid.appendChild(cell);
	}
}

function list(el, events, max=3) {
	try {
		el = document.getElementById(el) || document.getElementById('event-list');
		el.id = 'event-list';
		el.innerHTML = '';
		let i = 1, max = calendar.limit;
		const today = new Date();

		for (const date in events) {
			for (const event of events[date]) {
				const start = new Date(event.start);
				if (start < today) { max++; continue; }
				if (i >= max) { break; }

				const month = start.toLocaleString("en-US", { month: "short" }).toUpperCase();
				const day   = String(start.getDate()).padStart(2, "0");

				const starttime = start.toLocaleString("en-US", {
					hour: "numeric",
					minute: "2-digit",
					hour12: true
				});

				const endtime = new Date(event.end).toLocaleString("en-US", {
					hour: "numeric",
					minute: "2-digit",
					hour12: true
				});

				let cal = document.createElement('span');
				cal.className = 'date';
				cal.innerHTML = `<span class="month">${month}</span><span class="day">${day}</span>`;

				let time = document.createElement('span');
				time.className = 'time';
				time.innerHTML = `<span class="start">${starttime}</span><span class="end">${endtime}</span>`;

				let name = document.createElement('span');
				name.className = 'name';
				name.innerHTML = event.location.split(",")[0];

				let arrow = document.createElement('span');
				arrow.className = 'arrow';
				arrow.innerHTML = '<i class="fa-solid fa-diamond-turn-right"></i>';

				let ev = document.createElement('a');
				ev.className = 'event get-directions';
				ev.title = `Get Directions to ${event.location.split(",")[0]}`;
				ev.href = "javascript:void('getDirections');";
				ev.addEventListener("click", function() {
					getMapDirections(event.location);
				});

				ev.appendChild(cal);
				ev.appendChild(time);
				ev.appendChild(name);
				ev.appendChild(arrow);

				el.appendChild(ev);

				i++;
			}
		}
	} catch (error) {
		console.error("Error while iterating object:", error);
	}
}

function upcoming(el, events) {
	if (Object.keys(events).length == 0) { return; }

	if (calendar.style == "list") {
		list(el, events);
	} else {
		month(el, events);
	}
}
