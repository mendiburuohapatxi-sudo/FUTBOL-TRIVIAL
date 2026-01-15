
export type FootballCategory = 'torneos' | 'ligas' | 'leyendas' | 'clubes' | 'curiosidades' | 'fichajes';
export type SubCategory = 
  | 'global' | 'laliga' | 'premier' | 'seriea' | 'bundesliga' | 'ligue1'
  | 'mundial' | 'eurocopa' | 'champions' | 'copaamerica' | 'europaleague' | 'copalibertadores' | 'variado_torneos';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  goalsFor: number;
  goalsAgainst: number;
  correctInStage: number; // progress towards next goal (0-4)
  strikes: number;
  maxStrikes: number;
  questionNumber: number;
  history: GameTurn[];
  category?: FootballCategory;
  subCategory?: SubCategory;
  difficulty?: Difficulty;
  gameOver: boolean;
}

export interface GameTurn {
  role: 'user' | 'model';
  text: string;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface CategorySelection {
  id: FootballCategory;
  name: string;
  description: string;
  icon: string;
}

export interface SubCategoryOption {
  id: SubCategory;
  name: string;
  icon: string;
}

export interface DifficultyOption {
  id: Difficulty;
  label: string;
  strikes: number;
  color: string;
  description: string;
}
