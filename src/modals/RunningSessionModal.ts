import ListeningFileData from "model/ListeningFileData";
import { App, Modal, Setting } from "obsidian";

export default class RunningSessionModal extends Modal {
	constructor(
		app: App,
		private isPaused: boolean,
		private timerStartDate: Date | null,
		private listeningFileData: ListeningFileData | null,
		private resumeTimer: () => void,
		private pauseTimer: () => void,
		private stopTimer: () => void
	) {
		super(app);
	}

	onOpen() {
		this.setTitle("Running session");

		const { contentEl } = this;
		contentEl.empty();

		const startStr = this.timerStartDate
			? this.timerStartDate.toLocaleTimeString()
			: "Unknown time";
		new Setting(contentEl)
			.setName(`Started at: ${startStr}`)
			.setDesc(
				`Listening to: ${
					this.listeningFileData
						? this.listeningFileData.fileName
						: "No file"
				}`
			);

		const buttonContainer = new Setting(contentEl);
		buttonContainer.settingEl.addClass(
			"fbd-writing-stats__running-button-container"
		);

		buttonContainer.addButton((button) => {
			if (this.isPaused) {
				button.setButtonText("Play").onClick(() => {
					this.resumeTimer();
				});
			} else {
				button.setButtonText("Pause").onClick(() => {
					this.pauseTimer();
				});
			}
			button.setCta();
		});

		buttonContainer.addButton((button) => {
			button.setButtonText("Stop").onClick(() => {
				this.stopTimer();
			});
			button.setClass("fbd-writing-stats__running-stop-button");
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
