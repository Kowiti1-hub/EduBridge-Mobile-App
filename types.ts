
export enum MessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
  NOTE = 'note',
  LINK = 'link',
  AUDIO = 'audio',
  IMAGE = 'image',
  TEST = 'test'
}

export enum LearningStage {
  PRE_SCHOOL = 'Pre-School',
  ELEMENTARY = 'Elementary',
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  TERTIARY = 'Tertiary'
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  isUssd?: boolean;
  metadata?: {
    lessonNum?: number;
    totalLessons?: number;
    isComplete?: boolean;
    url?: string;
    audioData?: string; // Base64 encoded audio
    imageData?: string; // Base64 encoded image
    duration?: number;  // Seconds
    isHighQuality?: boolean;
    test?: Test;
  };
}

export interface Subject {
  id: string;
  title: string;
  icon: string;
  description: string;
  stage: LearningStage;
}

export interface Test {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface LessonContent {
  title: string;
  theory: string;
  question: string;
  test?: Test;
}

export interface LearningState {
  currentSubject: string | null;
  history: Message[];
  isThinking: boolean;
}
