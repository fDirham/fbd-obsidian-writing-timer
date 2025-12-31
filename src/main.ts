import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from "./settings";
import RunningSessionModal from "modals/RunningSessionModal";
import NewSessionModal from "modals/NewSessionModal";
import ListeningFileData from "model/ListeningFileData";
import SessionSummary from "model/SessionSummary";
import { getTimeDisplayString, getWordCount } from "utils";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	timerSbSpanEl: HTMLElement;
	isTimerRunning: boolean = false;
	isTimerPaused: boolean = false;
	timerStartDate: Date | null = null;
	timerEndDate: Date | null = null;
	timerIntervalId: number | null = null;
	countdownMs: number = 0;
	timerRunElapsedMs: number = 0;
	runningSessionModal: RunningSessionModal | null = null;
	listeningFileData: ListeningFileData | null = null;
	lastSessionSummary: SessionSummary | null = null;

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
			this.openRunningSessionModal();
			return;
		}

		this.listeningFileData = this.getListeningFileData();
		if (!this.listeningFileData) {
			new Notice("Please open a file to start a writing session.");
			return;
		}

		const newSessionModal = new NewSessionModal(
			this.app,
			this.listeningFileData,
			this.lastSessionSummary,
			(durationS) => {
				this.startTimer(durationS);
			}
		);
		newSessionModal.open();
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
				this.stopTimer();
				this.displaySbDone();
				new Notice("Writing session ended!");
				return;
			}

			// Calculate remaining time
			const diffFromPrevious = this.countdownMs - diffMs;
			this.timerRunElapsedMs += diffFromPrevious;
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
		this.timerSbSpanEl.setText(`⌛️ ${getTimeDisplayString(ms)}`);
	};

	private displaySbDefault = () => {
		this.timerSbSpanEl.setText("⌛️");
	};

	private displaySbDone = () => {
		this.timerSbSpanEl.setText("⏰ Session ended");
	};

	private displaySbPaused = (ms: number) => {
		this.timerSbSpanEl.setText(`⏸ ${getTimeDisplayString(ms)}`);
	};

	// MARK: Timer Controls
	startTimer = (durationS: number) => {
		if (this.isTimerRunning && !this.isTimerPaused) return;

		this.isTimerRunning = true;
		this.isTimerPaused = false;
		this.timerRunElapsedMs = 0;
		this.countdownMs = durationS * 1000;
		this.timerStartDate = new Date();
		this.timerEndDate = new Date(new Date().getTime() + durationS * 1000);

		this.startCountdown();
	};

	pauseTimer = () => {
		if (!this.isTimerRunning || this.isTimerPaused) return;

		this.isTimerPaused = true;
		this.clearCountdown();
		this.displaySbPaused(this.countdownMs);

		if (this.runningSessionModal) {
			this.runningSessionModal.close();
			this.openRunningSessionModal();
		}
	};

	resumeTimer = () => {
		if (!this.isTimerRunning || !this.isTimerPaused) return;
		const newEndDate = new Date(new Date().getTime() + this.countdownMs);

		this.timerEndDate = newEndDate;
		this.isTimerPaused = false;
		this.startCountdown();

		if (this.runningSessionModal) {
			this.runningSessionModal.close();
			this.openRunningSessionModal();
		}
	};

	stopTimer = async () => {
		if (this.listeningFileData) {
			const file = this.app.vault.getAbstractFileByPath(
				this.listeningFileData.filePath
			);
			let finalWordCount = 0;

			if (file instanceof TFile) {
				const content = await this.app.vault.read(file);
				finalWordCount = getWordCount(content);
			}

			const summary: SessionSummary = {
				listeningFileData: this.listeningFileData,
				timeElapsedMs: this.timerRunElapsedMs,
				finalWordCount: finalWordCount,
			};
			this.lastSessionSummary = summary;
		}

		this.isTimerRunning = false;
		this.isTimerPaused = false;
		this.timerEndDate = null;
		this.timerStartDate = null;
		this.countdownMs = 0;
		this.listeningFileData = null;
		this.timerRunElapsedMs = 0;
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

	// MARK: Modal Helpers
	private openRunningSessionModal = () => {
		this.runningSessionModal = new RunningSessionModal(
			this.app,
			this.isTimerPaused,
			this.timerStartDate,
			this.listeningFileData,
			this.resumeTimer,
			this.pauseTimer,
			this.stopTimer
		);
		this.runningSessionModal.open();
	};

	// MARK: File helpers
	private getListeningFileData = (): ListeningFileData | null => {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			const content = activeView?.editor?.getValue() || "";
			const wordCount = getWordCount(content);

			return {
				fileName: activeFile.name,
				filePath: activeFile.path,
				initialWordCount: wordCount,
			};
		} else {
			return null;
		}
	};

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
