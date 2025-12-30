import { App, Modal, Notice, Setting } from "obsidian";

export default class NewSessionModal extends Modal {
	constructor(app: App, private onStart: (durationS: number) => void) {
		super(app);
	}

	onOpen() {
		this.setTitle("Writing Session");

		let { contentEl } = this;

		let hours = 0;
		let minutes = 0;
		let seconds = 0;
		new Setting(contentEl)
			.setName("Duration")
			.addText((text) => {
				text.inputEl.setAttribute("type", "number");
				text.inputEl.addClass("fbd-writing-stats__time-input");

				text.setPlaceholder("h").onChange((value) => {
					hours = parseInt(value);
				});
				text.inputEl.insertAdjacentHTML("afterend", "<span>:</span>");
			})
			.addText((text) => {
				text.inputEl.setAttribute("type", "number");
				text.inputEl.addClass("fbd-writing-stats__time-input");

				text.setPlaceholder("m").onChange((value) => {
					minutes = parseInt(value);
				});
				text.inputEl.insertAdjacentHTML("afterend", "<span>:</span>");
			})
			.addText((text) => {
				text.inputEl.setAttribute("type", "number");
				text.inputEl.addClass("fbd-writing-stats__time-input");

				text.setPlaceholder("s").onChange((value) => {
					seconds = parseInt(value);
				});
			});

		new Setting(contentEl).addButton((button) => {
			button.setButtonText("Start Session").onClick(() => {
				const totalSeconds = hours * 3600 + minutes * 60 + seconds;
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
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
