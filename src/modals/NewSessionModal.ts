import ListeningFileData from "model/ListeningFileData";
import SessionSummary from "model/SessionSummary";
import { App, Modal, Notice, Setting } from "obsidian";
import { getTimeDisplayString } from "utils";

export default class NewSessionModal extends Modal {
	constructor(
		app: App,
		private listeningFileData: ListeningFileData,
		private lastSessionSummary: SessionSummary | null,
		private onStart: (durationS: number) => void
	) {
		super(app);
	}

	onOpen() {
		this.setTitle("New writing session");

		let { contentEl } = this;

		let hours = 0;
		let minutes = 0;
		let seconds = 0;
		new Setting(contentEl)
			.setName("Duration")
			.setDesc(`File: ${this.listeningFileData.fileName}`)
			.addText((text) => {
				text.inputEl.setAttribute("type", "number");
				text.inputEl.addClass("fbd-writing-stats__time-input");

				text.setPlaceholder("Hours").onChange((value) => {
					hours = parseInt(value);
				});
				text.inputEl.parentElement!.createEl("span", { text: ":" });
			})
			.addText((text) => {
				text.inputEl.setAttribute("type", "number");
				text.inputEl.addClass("fbd-writing-stats__time-input");

				text.setPlaceholder("Min").onChange((value) => {
					minutes = parseInt(value);
				});
				text.inputEl.parentElement!.createEl("span", { text: ":" });
			})
			.addButton((button) => {
				button
					.setCta()
					.setButtonText("Start session")
					.onClick(() => {
						const totalSeconds =
							hours * 3600 + minutes * 60 + seconds;
						if (isNaN(totalSeconds) || totalSeconds <= 0) {
							new Notice("Please enter a valid duration.");
							return;
						}
						if (totalSeconds > 99 * 3600) {
							new Notice("Duration cannot exceed 99 hours.");
							return;
						}

						this.onStart(totalSeconds);
						this.close();
					});
			});

		if (this.lastSessionSummary) {
			const durationString = getTimeDisplayString(
				this.lastSessionSummary.timeElapsedMs
			);

			new Setting(contentEl).setHeading().setName("Last session summary");

			const numWordsWritten =
				this.lastSessionSummary.finalWordCount -
				this.lastSessionSummary.listeningFileData.initialWordCount;
			const wpm = Math.round(
				(numWordsWritten /
					(this.lastSessionSummary.timeElapsedMs / 1000)) *
					60
			);
			new Setting(contentEl)
				.setName("Words Written: " + numWordsWritten)
				.setDesc(`WPM: ${wpm}`);

			new Setting(contentEl).setName("Duration: " + durationString);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
