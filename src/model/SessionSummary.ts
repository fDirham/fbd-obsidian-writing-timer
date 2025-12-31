import ListeningFileData from "./ListeningFileData";

export default interface SessionSummary {
	listeningFileData: ListeningFileData;
	finalWordCount: number;
	timeElapsedMs: number;
}
