import MyPlugin from "main";
import { App, Modal, Setting } from "obsidian";

export default class RunningSessionModal extends Modal {
	constructor(
		app: App,
		private isPaused: boolean,
		private resumeTimer: () => void,
		private pauseTimer: () => void,
		private stopTimer: () => void
	) {
		super(app);
	}

	onOpen() {
		this.setTitle("Running Session");

		const { contentEl } = this;
		contentEl.empty();

		const buttonContainer = new Setting(contentEl);

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
		});

		buttonContainer.addButton((button) => {
			button.setButtonText("Stop").onClick(() => {
				this.stopTimer();
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
