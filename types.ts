export enum ListeningType {
  CONVERSATION = 'Conversation',
  LECTURE = 'Lecture',
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
}

export interface TOEFLContent {
  title: string;
  script: string;
  questions: Question[];
  durationEstimate: string;
}

export enum AppState {
  SETUP = 'SETUP',
  GENERATING = 'GENERATING',
  LISTENING = 'LISTENING',
  QUIZ = 'QUIZ',
  REVIEW = 'REVIEW',
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasEnded: boolean;
}