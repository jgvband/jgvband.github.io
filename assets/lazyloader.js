const ytMilestones = new Set();
function trackYouTubeProgress(player, videoId) {
	const interval = setInterval(() => {
	const duration = player.getDuration();
	const current = player.getCurrentTime();

	if (!duration || duration < 5) return; // avoid divide-by-zero

	const percent = Math.floor((current / duration) * 100);
	const milestones = [10, 25, 50, 75, 90, 100];

	milestones.forEach(m => {
		const key = `${videoId}-${m}`;
		if (percent >= m && !ytMilestones.has(key)) {
			ytMilestones.add(key);

			gtag('event', 'youtube_percent_watched', {
				video_id: videoId,
				percent: m
			});
		}
	});
	}, 1000);

	return interval;
}

document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".embed").forEach(el => {
		const type = el.dataset.type;
		const id = el.dataset.id;

		// Random shimmer variables
		el.style.setProperty("--skew", (-10 - Math.random() * 30).toFixed(1) + "deg");
		el.style.setProperty("--delay", (Math.random() * 0.8).toFixed(2) + "s");

		// Create iframe
		const iframe = document.createElement("iframe");
		iframe.loading = "lazy";

		if (type === "youtube") {
			iframe.height = "250";
			iframe.src = `https://www.youtube.com/embed/${id}`;
			if (window.YT) {
				iframe.src += `?enablejsapi=1`;
			}
			iframe.allowFullscreen = true;
		}

		if (type === "spotify") {
			iframe.height = "152";
			iframe.src = `https://open.spotify.com/embed/track/${id}`;
			iframe.allow = "encrypted-media";
			iframe.style.borderRadius = "12px";

			el.addEventListener("click", () => {
				gtag('event', 'spotify_interaction', {
					track_id: id
				});
			});
		}

		el.appendChild(iframe);

		iframe.onload = () => {
			iframe.dataset.loaded = "true";

			if (type === "youtube") {
				let progressInterval = null;

				if (window.YT) {
					new YT.Player(iframe, {
						events: {
							onStateChange: event => {
								const player = event.target;

								// PLAY
								if (event.data === YT.PlayerState.PLAYING) {
									gtag('event', 'youtube_play', { video_id: id });
									// Start progress tracking
									if (!progressInterval) {
										progressInterval = trackYouTubeProgress(player, id);
									}
								}

								// PAUSE
								if (event.data === YT.PlayerState.PAUSED) {
									gtag('event', 'youtube_pause', { video_id: id });
									// Stop progress tracking
									if (progressInterval) {
										clearInterval(progressInterval);
										progressInterval = null;
									}
								}

								// END
								if (event.data === YT.PlayerState.ENDED) {
									gtag('event', 'youtube_end', { video_id: id });

									// Stop progress tracking
									if (progressInterval) {
										clearInterval(progressInterval);
										progressInterval = null;
									}
								}
							}
						}
					});
				}
			}
		};
	});
});
