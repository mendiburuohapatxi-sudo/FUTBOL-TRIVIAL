import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion, FootballCategory, Difficulty, SubCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const OFFLINE_QUESTIONS: Record<string, TriviaQuestion[]> = {
  torneos: [
    {
      question: "¿Qué país ganó el primer Mundial de la historia en 1930?",
      options: ["Argentina", "Uruguay", "Brasil", "Italia"],
      correctAnswerIndex: 1,
      explanation: "Uruguay fue el anfitrión y el primer campeón tras vencer a Argentina en la final."
    }
  ],
  curiosidades: [
    {
      question: "¿Qué selección nacional tiene el récord de más partidos seguidos sin perder?",
      options: ["Brasil", "Italia", "España", "Argentina"],
      correctAnswerIndex: 1,
      explanation: "Italia, bajo el mando de Mancini, alcanzó 37 partidos invicta entre 2018 y 2021."
    }
  ],
  fichajes: [
    {
      question: "¿Quién fue el primer jugador en costar más de 100 millones de euros?",
      options: ["Cristiano Ronaldo", "Gareth Bale", "Neymar Jr.", "Paul Pogba"],
      correctAnswerIndex: 1,
      explanation: "Gareth Bale fue el primer traspaso que superó oficialmente los 100 millones al fichar por el Real Madrid."
    }
  ]
};

const getCategoryContext = (cat: FootballCategory, sub?: SubCategory) => {
  if (cat === 'ligas' && sub) {
    const leagues: Record<string, string> = {
      laliga: "la liga española (LaLiga EA Sports)",
      premier: "la Premier League inglesa",
      seriea: "la Serie A italiana",
      bundesliga: "la Bundesliga alemana",
      ligue1: "la Ligue 1 francesa",
      global: "las ligas europeas de élite combinadas"
    };
    return `fútbol de ${leagues[sub] || 'ligas europeas'}`;
  }

  if (cat === 'torneos' && sub) {
    const tournaments: Record<string, string> = {
      mundial: "la Copa del Mundo de la FIFA",
      eurocopa: "la Eurocopa de la UEFA",
      champions: "la UEFA Champions League",
      copaamerica: "la Copa América de la CONMEBOL",
      europaleague: "la UEFA Europa League",
      copalibertadores: "la Copa Libertadores de América",
      variado_torneos: "una mezcla variada de los torneos más importantes (Mundial, Eurocopa, Champions, Europa League y Libertadores)"
    };
    return `historia, récords y datos de ${tournaments[sub] || 'grandes competiciones de fútbol'}`;
  }
  
  const contexts: Record<FootballCategory, string> = {
    torneos: "grandes torneos internacionales y de clubes",
    ligas: "las mejores ligas de fútbol del mundo",
    leyendas: "leyendas históricas del fútbol (Pelé, Maradona, Cruyff, Zidane, etc.)",
    clubes: "historia, estadios y datos de clubes de fútbol mundial",
    curiosidades: "récords extraños, datos bizarros y curiosidades del fútbol",
    fichajes: "el mercado de fichajes, traspasos históricos y movimientos récord"
  };
  return contexts[cat];
};

const getDifficultyPrompt = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return "FÁCIL: Datos conocidos por fans ocasionales.";
    case 'medium': return "MEDIA: Datos para seguidores habituales del fútbol.";
    case 'hard': return "DIFÍCIL: Datos oscuros, estadísticas raras o historia antigua para expertos.";
    default: return "";
  }
};

const SYSTEM_PROMPT = `Eres un historiador experto en fútbol mundial. Genera preguntas de trivia únicas y desafiantes. 
REGLA DE ORO: No repitas preguntas obvias. Devuelve JSON con question, options (4), correctAnswerIndex (0-3) y explanation.`;

export const getNextQuestion = async (
  category: FootballCategory, 
  difficulty: Difficulty = 'medium', 
  subCategory?: SubCategory,
  previousQuestions: string[] = []
): Promise<TriviaQuestion> => {
  if (!process.env.API_KEY) {
    const list = OFFLINE_QUESTIONS[category] || OFFLINE_QUESTIONS['torneos'];
    return list[Math.floor(Math.random() * list.length)];
  }

  try {
    const context = getCategoryContext(category, subCategory);
    const avoidPrompt = previousQuestions.length > 0 ? `Evita estas preguntas exactas: ${previousQuestions.slice(-5).join(", ")}` : "";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        role: 'user', 
        parts: [{ text: `Pregunta sobre ${context}. Nivel de dificultad: ${getDifficultyPrompt(difficulty)}. ${avoidPrompt}` }] 
      }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    });
    return JSON.parse(response.text || '{}') as TriviaQuestion;
  } catch (error) {
    const list = OFFLINE_QUESTIONS[category] || OFFLINE_QUESTIONS['torneos'];
    return list[Math.floor(Math.random() * list.length)];
  }
};
