import { Notice, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from "./settings";
import RunningSessionModal from "modals/RunningSessionModal";
import NewSessionModal from "modals/NewSessionModal";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	timerSbSpanEl: HTMLElement;
	isTimerRunning: boolean = false;
	isTimerPaused: boolean = false;
	timerEndDate: Date | null = null;
	timerIntervalId: number | null = null;
	countdownMs: number = 0;
	runningSessionModal: RunningSessionModal | null = null;

	async onload() {
		await this.loadSettings();

		const timerSbItemEl = this.addStatusBarItem();
		const sbButtonEl = timerSbItemEl.createEl("button");
		this.timerSbSpanEl = sbButtonEl.createEl("span");
		this.displaySbDefault();

		sbButtonEl.onClickEvent(() => {
			this.onTimerSbPress();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	private onTimerSbPress = () => {
		if (this.isTimerRunning) {
			this.runningSessionModal = new RunningSessionModal(
				this.app,
				this.isTimerPaused,
				this.resumeTimer,
				this.pauseTimer,
				this.stopTimer
			);
			this.runningSessionModal.open();
			return;
		}

		new NewSessionModal(this.app, (durationS) => {
			this.isTimerRunning = true;
			this.isTimerPaused = false;
			this.countdownMs = durationS * 1000;
			this.timerEndDate = new Date(
				new Date().getTime() + durationS * 1000
			);

			this.startCountdown();
		}).open();
	};

	// MARK: Countdown Logic

	private startCountdown = () => {
		this.clearCountdown();

		const countdownLogic = () => {
			if (
				!this.isTimerRunning ||
				!this.timerEndDate ||
				this.isTimerPaused
			)
				return;

			const now = new Date();
			const diffMs = this.timerEndDate.getTime() - now.getTime();

			if (diffMs <= 0) {
				this.isTimerRunning = false;
				this.timerEndDate = null;
				this.displaySbDone();
				new Notice("Writing session ended!");

				this.clearCountdown();
				return;
			}

			// Calculate remaining time
			this.countdownMs = diffMs;
			this.displaySbTime(diffMs);
		};

		this.timerIntervalId = window.setInterval(() => {
			countdownLogic();
		}, 1000);

		countdownLogic();
	};

	private clearCountdown = () => {
		if (this.timerIntervalId !== null) {
			clearInterval(this.timerIntervalId);
			this.timerIntervalId = null;
		}
	};

	// MARK: Displays

	private displaySbTime = (ms: number) => {
		const diffSecondsTotal = Math.floor(ms / 1000);
		const diffHours = String(Math.floor(diffSecondsTotal / 3600)).padStart(
			2,
			"0"
		);
		const diffMinutes = String(
			Math.floor((diffSecondsTotal % 3600) / 60)
		).padStart(2, "0");
		const diffSeconds = String(diffSecondsTotal % 60).padStart(2, "0");

		this.timerSbSpanEl.setText(
			`⌛️ ${diffHours}:${diffMinutes}:${diffSeconds}`
		);
	};

	private displaySbDefault = () => {
		this.timerSbSpanEl.setText("⌛️");
	};

	private displaySbDone = () => {
		this.timerSbSpanEl.setText("⏰ Session ended");
	};

	private displaySbPaused = () => {
		this.timerSbSpanEl.setText("⏸ Paused");
	};

	// MARK: Timer Controls
	pauseTimer = () => {
		if (!this.isTimerRunning || this.isTimerPaused) return;

		this.isTimerPaused = true;
		this.clearCountdown();

		this.runningSessionModal?.onOpen();
	};

	resumeTimer = () => {
		if (!this.isTimerRunning || !this.isTimerPaused) return;
		const newEndDate = new Date(new Date().getTime() + this.countdownMs);

		this.timerEndDate = newEndDate;
		this.isTimerPaused = false;
		this.startCountdown();

		this.runningSessionModal?.onOpen();
	};

	stopTimer = () => {
		this.isTimerRunning = false;
		this.isTimerPaused = false;
		this.timerEndDate = null;
		this.countdownMs = 0;
		this.clearCountdown();
		this.displaySbDefault();

		if (this.runningSessionModal) {
			this.runningSessionModal.close();
			this.runningSessionModal = null;
		}
	};

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
