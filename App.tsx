
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TriviaQuestion, CategorySelection, FootballCategory, Difficulty, DifficultyOption, SubCategory, SubCategoryOption } from './types';
import { getNextQuestion } from './services/geminiService';
import { 
  Trophy, RotateCcw, ChevronRight, Info, History, Shield, CheckCircle2, 
  XCircle, Flame, Dribbble, Crosshair, ArrowLeft, Timer, Swords, Star, Zap,
  Activity, Target, AlertTriangle, Coins, Globe, Medal, LayoutGrid, HelpCircle, X,
  Flag, ClipboardList, User, Monitor, BarChart3, Radio
} from 'lucide-react';

const CATEGORIES: CategorySelection[] = [
  { id: 'torneos', name: 'Grandes Torneos', description: 'Competiciones élite internacionales.', icon: '🏆' },
  { id: 'ligas', name: 'Ligas Europeas', description: 'Las ligas más potentes del mundo.', icon: '🇪🇺' },
  { id: 'leyendas', name: 'Leyendas', description: 'Los mejores de la historia.', icon: '🐐' },
  { id: 'clubes', name: 'Clubes', description: 'Estadios y escudos.', icon: '🛡️' },
  { id: 'curiosidades', name: 'Récords y Bizarro', description: 'Datos locos e imposibles.', icon: '🌀' },
  { id: 'fichajes', name: 'Fichajes', description: 'Cifras y traspasos récords.', icon: '💸' },
];

const LEAGUES: SubCategoryOption[] = [
  { id: 'global', name: 'Combinado Europeo', icon: '🌍' },
  { id: 'laliga', name: 'LaLiga EA Sports', icon: '🇪🇸' },
  { id: 'premier', name: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'seriea', name: 'Serie A TIM', icon: '🇮🇹' },
  { id: 'bundesliga', name: 'Bundesliga', icon: '🇩🇪' },
  { id: 'ligue1', name: 'Ligue 1 McDonald\'s', icon: '🇫🇷' },
];

const MAJOR_TOURNAMENTS: SubCategoryOption[] = [
  { id: 'mundial', name: 'Copa del Mundo', icon: '🏆' },
  { id: 'eurocopa', name: 'Eurocopa', icon: '🇪🇺' },
  { id: 'champions', name: 'Champions League', icon: '⭐' },
  { id: 'copaamerica', name: 'Copa América', icon: '🌎' },
  { id: 'europaleague', name: 'Europa League', icon: '🟧' },
  { id: 'copalibertadores', name: 'Libertadores', icon: '⚔️' },
  { id: 'variado_torneos', name: 'Variado Torneos', icon: '🎲' },
];

const DIFFICULTIES: DifficultyOption[] = [
  { id: 'easy', label: 'Amateur', strikes: 5, color: 'text-cyan-400', description: '5 Vidas - Datos básicos' },
  { id: 'medium', label: 'Profesional', strikes: 3, color: 'text-yellow-400', description: '3 Vidas - Conocedor' },
  { id: 'hard', label: 'Leyenda', strikes: 1, color: 'text-red-500', description: '1 Vida - Solo expertos' },
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    goalsFor: 0, goalsAgainst: 0, correctInStage: 0, strikes: 3, maxStrikes: 3, questionNumber: 0, history: [], gameOver: false
  });

  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FootballCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [records, setRecords] = useState<Record<string, number>>({});

  const askedQuestionsRef = useRef<string[]>([]);

  // Load records from local storage
  useEffect(() => {
    const savedRecords = localStorage.getItem('futbol_trivial_records');
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  const updateRecord = (cat: FootballCategory, goals: number) => {
    setRecords(prev => {
      const currentRecord = prev[cat] || 0;
      if (goals > currentRecord) {
        const newRecords = { ...prev, [cat]: goals };
        localStorage.setItem('futbol_trivial_records', JSON.stringify(newRecords));
        return newRecords;
      }
      return prev;
    });
  };

  const fetchQuestion = useCallback(async (cat: FootballCategory, diff: Difficulty, sub?: SubCategory) => {
    setLoading(true);
    setSelectedAnswer(null);
    try {
      const q = await getNextQuestion(cat, diff, sub, askedQuestionsRef.current);
      setCurrentQuestion(q);
      askedQuestionsRef.current = [...askedQuestionsRef.current, q.question].slice(-20);
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const initGame = (diff: Difficulty) => {
    if (!selectedCategory) return;
    const diffOpt = DIFFICULTIES.find(d => d.id === diff)!;
    setGameState({
      goalsFor: 0, goalsAgainst: 0, correctInStage: 0, strikes: diffOpt.strikes, maxStrikes: diffOpt.strikes,
      questionNumber: 1, history: [], category: selectedCategory,
      subCategory: selectedSubCategory || undefined, difficulty: diff, gameOver: false
    });
    setGameStarted(true);
    fetchQuestion(selectedCategory, diff, selectedSubCategory || undefined);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !currentQuestion || gameState.gameOver) return;
    const correct = index === currentQuestion.correctAnswerIndex;
    setSelectedAnswer(index);
    
    if (correct) {
      setGameState(prev => {
        let newCorrectInStage = prev.correctInStage + 1;
        let newGoalsFor = prev.goalsFor;
        let isGameOver = false;

        if (newCorrectInStage >= 5) {
          newCorrectInStage = 0;
          newGoalsFor += 1;
          if (newGoalsFor >= 5) {
            isGameOver = true;
          }
        }
        
        if (isGameOver && prev.category) {
          updateRecord(prev.category, newGoalsFor);
        }

        return { 
          ...prev, 
          correctInStage: newCorrectInStage, 
          goalsFor: newGoalsFor,
          gameOver: isGameOver
        };
      });
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      setGameState(prev => {
        const newStrikes = prev.strikes - 1;
        const isGameOver = newStrikes <= 0;
        
        if (isGameOver && prev.category) {
          updateRecord(prev.category, prev.goalsFor);
        }

        return { 
          ...prev, 
          strikes: newStrikes, 
          goalsAgainst: prev.goalsAgainst + 1,
          gameOver: isGameOver
        };
      });
    }
  };

  const nextQuestion = () => {
    if (gameState.gameOver || !gameState.category || !gameState.difficulty) return;
    setGameState(prev => ({ ...prev, questionNumber: prev.questionNumber + 1 }));
    fetchQuestion(gameState.category, gameState.difficulty, gameState.subCategory);
  };

  const restart = () => {
    setGameStarted(false);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setGameState({
      goalsFor: 0, goalsAgainst: 0, correctInStage: 0, strikes: 3, maxStrikes: 3, questionNumber: 0, history: [], gameOver: false
    });
    setCurrentQuestion(null);
    askedQuestionsRef.current = [];
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showInstructions && e.key === 'Escape') {
        setShowInstructions(false);
        return;
      }
      if (!gameStarted) {
        if (e.key === 'Escape') {
          if (selectedSubCategory) setSelectedSubCategory(null);
          else setSelectedCategory(null);
        }
      } else if (currentQuestion && selectedAnswer === null && !gameState.gameOver) {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < 4) handleAnswer(idx);
      } else if (selectedAnswer !== null && !gameState.gameOver) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') nextQuestion();
      } else if (gameState.gameOver && e.key === 'Enter') restart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, selectedCategory, selectedSubCategory, currentQuestion, selectedAnswer, gameState.gameOver, showInstructions]);

  const renderSubMenu = (items: SubCategoryOption[], title: string) => (
    <div className="z-10 w-full max-w-5xl animate-in slide-in-from-right-12 duration-500 py-12 text-center">
      <button onClick={() => setSelectedCategory(null)} className="mb-12 flex items-center gap-3 text-green-500 hover:text-white transition-all font-black text-xl italic group">
        <ArrowLeft size={32} className="group-hover:-translate-x-2 transition-transform" /> VOLVER AL MENÚ
      </button>
      <h2 className="text-6xl font-black italic text-white mb-12 uppercase tracking-tighter text-left border-l-8 border-green-500 pl-8">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedSubCategory(item.id)}
            className="group p-8 bg-black/40 border-4 border-white/10 hover:border-green-500 text-center skew-box transition-all hover:bg-green-500/5 shadow-[8px_8px_0_rgba(0,0,0,1)]"
          >
            <div className="skew-box-inner">
              <div className="text-5xl mb-4 group-hover:rotate-12 transition-transform">{item.icon}</div>
              <div className="font-black text-white uppercase italic text-xl leading-none">{item.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const goalProgressPercent = gameState.correctInStage * 20;
  const isVictory = gameState.goalsFor >= 5;

  if (!gameStarted) {
    return (
      <div className="min-h-screen relative flex flex-col items-center p-6 text-center">
        <div className="scanline"></div>
        <div className="vignette"></div>

        {showInstructions && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in duration-300">
             <div className="relative w-full max-w-4xl bg-[#020617] border-4 border-green-500 p-8 md:p-12 skew-box shadow-[0_0_100px_rgba(34,197,94,0.2)] tactical-border overflow-y-auto max-h-[90vh]">
                <div className="skew-box-inner text-left">
                  <div className="flex justify-between items-start mb-10">
                    <div className="border-l-8 border-green-500 pl-6">
                      <h2 className="text-5xl md:text-7xl font-black italic text-white uppercase tracking-tighter leading-none">MANUAL TÁCTICO</h2>
                      <p className="text-green-500 font-bold tracking-[0.4em] mt-2 flex items-center gap-2 text-xs"><Info size={14} /> PROTOCOLO DE OPERACIONES</p>
                    </div>
                    <button onClick={() => setShowInstructions(false)} className="bg-green-500 text-black p-2 hover:bg-white transition-colors">
                      <X size={32} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <section className="space-y-6">
                      <div className="flex gap-4">
                        <Target className="text-green-500 shrink-0" size={32} />
                        <div>
                          <h4 className="text-xl font-black text-white italic">REGLAS DEL MARCADOR</h4>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">CADA <span className="text-green-500 font-bold">5 PREGUNTAS CORRECTAS</span> ANOTAS UN GOL. ¡LLEGA A <span className="text-green-500 font-bold">5 GOLES</span> PARA GANAR EL PARTIDO! CADA <span className="text-hazard-red font-bold">ERROR</span> ES UN GOL EN CONTRA Y PIERDES UNA VIDA.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Swords className="text-green-500 shrink-0" size={32} />
                        <div>
                          <h4 className="text-xl font-black text-white italic">CONTROLES DE CAMPO</h4>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">PUEDES USAR EL PUNTERO O LAS TECLAS <span className="text-green-500 font-bold">1, 2, 3, 4</span> PARA RESPONDER. <span className="text-green-500 font-bold">ENTER</span> PARA CONTINUAR.</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="flex gap-4">
                        <Shield className="text-green-500 shrink-0" size={32} />
                        <div>
                          <h4 className="text-xl font-black text-white italic">RESERVA DE ENERGÍA</h4>
                          <p className="text-white/60 text-sm mt-1 leading-relaxed">SI TUS VIDAS LLEGAN A CERO, EL PARTIDO TERMINA. EL NÚMERO DE VIDAS DEPENDE DE LA DIFICULTAD SELECCIONADA.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Star className="text-green-500 shrink-0" size={32} />
                        <div>
                          <h4 className="text-xl font-black text-white italic">DIFICULTADES</h4>
                          <ul className="text-white/60 text-xs mt-2 space-y-1 font-bold">
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-400"></div> AMATEUR: 5 VIDAS</li>
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400"></div> PROFESIONAL: 3 VIDAS</li>
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500"></div> LEYENDA: 1 VIDA</li>
                          </ul>
                        </div>
                      </div>
                    </section>
                  </div>

                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="mt-10 w-full py-6 bg-green-500 text-black font-black italic text-2xl hover:bg-white transition-all shadow-[8px_8px_0_#000]"
                  >
                    ENTENDIDO, VOLVER AL ESTADIO
                  </button>
                </div>
             </div>
          </div>
        )}

        {!selectedCategory ? (
          <div className="z-10 w-full max-w-6xl animate-in zoom-in duration-500 py-12">
            <div className="flex flex-col items-center mb-16">
              <div className="bg-green-500 text-black px-6 py-2 skew-box mb-6 border-b-8 border-green-800">
                 <span className="skew-box-inner font-black text-2xl italic tracking-tighter">DATA CENTER</span>
              </div>
              <h1 className="text-6xl md:text-[10rem] font-black italic text-white leading-none tracking-tighter drop-shadow-[10px_10px_0_rgba(34,197,94,0.3)] glitch-text">
                FÚTBOL <span className="text-green-500">TRIVIAL</span>
              </h1>
              <div className="h-2 w-full max-w-3xl bg-white/5 mt-4 overflow-hidden relative border border-white/10">
                <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                <div className="h-full bg-green-500 w-1/3 animate-[move_3s_infinite_linear] shadow-[0_0_20px_#22c55e]"></div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-green-500 hover:text-black border-2 border-green-500 px-8 py-3 skew-box transition-all text-green-500 font-bold italic tracking-widest text-sm group"
                >
                  <HelpCircle size={20} className="skew-box-inner group-hover:rotate-12 transition-transform" />
                  <span className="skew-box-inner">MANUAL TÁCTICO</span>
                </button>
                <div className="flex items-center gap-3 bg-black/80 border-2 border-white/20 px-8 py-3 skew-box text-white/40 font-bold italic text-sm">
                   <Radio size={20} className="skew-box-inner animate-pulse text-green-500" />
                   <span className="skew-box-inner">CONEXIÓN SATELITAL: OK</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {CATEGORIES.map((cat) => {
                const record = records[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); window.scrollTo(0, 0); }}
                    className="group relative p-8 bg-black/40 border-4 border-white/10 hover:border-green-500 transition-all active:scale-95 text-left skew-box hover:bg-green-500/5 shadow-[15px_15px_0_rgba(0,0,0,0.8)] overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
                    <div className="skew-box-inner flex flex-col gap-4 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="text-6xl group-hover:scale-125 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{cat.icon}</div>
                        {record > 0 && (
                          <div className="bg-green-500/10 border border-green-500/30 px-3 py-1 text-[10px] text-green-500 font-black italic tracking-tighter animate-pulse">
                            RÉCORD: {record} GOLES
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-3xl text-white italic group-hover:text-green-500 transition-colors uppercase leading-none tracking-tighter">{cat.name}</h3>
                        <p className="text-[10px] text-white/40 font-black tracking-[0.2em] mt-3 group-hover:text-white/80 transition-colors">{cat.description}</p>
                      </div>
                    </div>
                    {/* Background Graphic */}
                    <BarChart3 className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32 group-hover:text-green-500/10 transition-colors duration-700" />
                    <div className="absolute top-4 right-4 text-green-500/5 group-hover:text-green-500/20 font-black text-6xl italic transition-colors select-none">0{CATEGORIES.indexOf(cat)+1}</div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-20 flex flex-col items-center gap-6">
              <div className="bg-white/5 p-1 skew-box border border-white/10 shadow-2xl relative">
                <div className="bg-black/80 px-12 py-6 skew-box-inner flex items-center gap-6 border border-white/5">
                  <div className="relative">
                    <ClipboardList className="text-green-500" size={32} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] block leading-none mb-2">ARQUITECTO DEL SISTEMA</span>
                    <span className="text-2xl text-white font-black italic uppercase tracking-tighter leading-none">
                      DIRECCIÓN TÉCNICA: <span className="text-green-500 glitch-text">PATXI MENDIBURU</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 opacity-20">
                <div className="h-[1px] w-20 bg-white"></div>
                <div className="text-[10px] font-black tracking-[1em] italic">FÚTBOL ANALYTICS V4.0</div>
                <div className="h-[1px] w-20 bg-white"></div>
              </div>
            </div>
          </div>
        ) : (selectedCategory === 'ligas' || selectedCategory === 'torneos') && !selectedSubCategory ? (
          selectedCategory === 'ligas' 
            ? renderSubMenu(LEAGUES, 'Ligas Europeas')
            : renderSubMenu(MAJOR_TOURNAMENTS, 'Grandes Competiciones')
        ) : (
          <div className="z-10 w-full max-w-3xl animate-in slide-in-from-right-12 duration-500 py-12">
            <button onClick={() => (selectedCategory === 'ligas' || selectedCategory === 'torneos') ? setSelectedSubCategory(null) : setSelectedCategory(null)} className="mb-12 flex items-center gap-3 text-green-500 hover:text-white transition-all font-black text-xl italic group">
              <ArrowLeft size={32} /> VOLVER
            </button>
            <h2 className="text-7xl md:text-8xl font-black italic text-white mb-16 uppercase tracking-tighter text-left border-l-8 border-green-500 pl-8">DIFICULTAD</h2>
            <div className="space-y-6">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => initGame(diff.id)}
                  className="group w-full p-8 bg-black/40 border-4 border-white/10 hover:border-white text-left skew-box transition-all hover:bg-white/5 shadow-[12px_12px_0_rgba(0,0,0,1)] relative overflow-hidden"
                >
                  <div className="skew-box-inner flex items-center justify-between relative z-10">
                    <div>
                      <h3 className={`font-black text-5xl uppercase italic leading-none ${diff.color}`}>{diff.label}</h3>
                      <p className="text-sm text-white/30 font-black uppercase tracking-[0.3em] mt-3 group-hover:text-white/60">{diff.description}</p>
                    </div>
                    <div className="flex gap-2">
                       {[...Array(3)].map((_, i) => <Star key={i} size={32} className={`${i === 0 ? diff.color : 'text-white/10'} group-hover:scale-125 transition-transform`} fill="currentColor" />)}
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-current group-hover:w-full transition-all duration-500 opacity-5 pointer-events-none" style={{ color: diff.color.split('-')[1] }}></div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative flex flex-col pitch-gradient ${shaking ? 'wrong-shake' : ''} ${flash ? 'brightness-150 saturate-200' : ''} transition-all duration-300`}>
      <div className="scanline"></div>
      
      <header className="bg-black border-b-8 border-green-500 z-50 shadow-[0_15px_50px_rgba(0,0,0,1)] sticky top-0">
        {!gameState.gameOver && (
          <div className="w-full bg-black/60 h-10 md:h-14 overflow-hidden relative border-b-4 border-green-500/30 group">
             <div 
               className="h-full bg-green-500 shadow-[0_0_40px_#22c55e] transition-all duration-700 ease-out"
               style={{ width: `${goalProgressPercent}%` }}
             />
             <div className="absolute inset-0 flex items-center justify-center gap-6">
                <Target size={24} className="text-white animate-spin-slow" />
                <span className="text-lg md:text-2xl font-black text-white tracking-[0.4em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)] italic">
                   BATERÍA DE GOL: <span className="text-green-300 text-4xl">{gameState.correctInStage}</span> <span className="text-white/30">/</span> 5
                </span>
                <div className="hidden md:flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`h-2 w-8 skew-box ${i < gameState.correctInStage ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/10'}`} />
                   ))}
                </div>
             </div>
          </div>
        )}

        <div className="p-4 md:p-6 flex justify-between items-center">
          <div className="flex items-center gap-6 md:gap-10">
            <button onClick={restart} className="text-green-500 hover:text-white transition-all bg-white/5 p-3 md:p-4 skew-box border-4 border-green-500/20 hover:border-green-500 group">
              <RotateCcw size={24} className="skew-box-inner group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <div className="flex flex-col">
              <div className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em] flex items-center gap-2 italic">MARCADOR TÁCTICO</div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-white/40 font-bold mb-1 tracking-widest">USER</span>
                  <div className="bg-green-500 text-black px-5 py-2 skew-box font-black text-4xl italic shadow-[0_0_20px_rgba(34,197,94,0.4)] relative">
                    <span className="skew-box-inner">{gameState.goalsFor}</span>
                  </div>
                </div>
                <div className="text-white/20 font-black text-2xl animate-pulse">VS</div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-white/40 font-bold mb-1 tracking-widest">AI</span>
                  <div className="bg-hazard-red text-white px-5 py-2 skew-box font-black text-4xl italic shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <span className="skew-box-inner">{gameState.goalsAgainst}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-center">
            <div className="bg-white text-black px-12 py-2 skew-box border-r-8 border-green-500 shadow-xl">
              <span className="skew-box-inner font-black uppercase text-2xl italic tracking-tighter">DATA STREAMING</span>
            </div>
            <div className="flex gap-4 mt-2">
               <div className="text-xs font-black uppercase text-green-500 bg-green-500/10 px-4 py-1 skew-box border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                 <span className="skew-box-inner">JUGADA #{gameState.questionNumber}</span>
               </div>
               <div className="text-xs font-black uppercase text-white/50 bg-white/5 px-4 py-1 skew-box border border-white/10">
                 <span className="skew-box-inner">{gameState.difficulty?.toUpperCase()}</span>
               </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2 italic">ENERGÍA RESTANTE <Shield size={12} /></div>
            <div className="flex gap-1.5 md:gap-2">
              {[...Array(gameState.maxStrikes)].map((_, i) => (
                <div key={i} className={`w-8 md:w-12 h-4 md:h-5 skew-box transition-all duration-500 ${i < gameState.strikes ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)]' : 'bg-red-900/10 border-2 border-red-500/40'}`} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative p-6 md:p-12 max-w-7xl mx-auto w-full z-20">
        {gameState.gameOver ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
            <div className={`px-12 py-5 skew-box mb-10 border-b-[15px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${isVictory ? 'bg-green-600 border-green-900' : 'bg-red-600 border-red-900'}`}>
               <span className="skew-box-inner font-black text-5xl italic uppercase flex items-center gap-6">
                  {isVictory ? <Medal size={48} /> : <AlertTriangle size={48} />}
                  {isVictory ? '¡CAMPEÓN INVICTO!' : 'PARTIDO FINALIZADO'}
               </span>
            </div>
            <h2 className={`text-8xl md:text-[14rem] font-black italic text-white uppercase mb-12 tracking-tighter leading-none glitch-text text-center ${isVictory ? 'animate-bounce' : ''}`}>
               {isVictory ? 'VICTORIA' : 'DERROTA'}
            </h2>
            <div className="bg-black/90 p-14 border-8 border-white/10 skew-box mb-16 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-green-500/5 pointer-events-none"></div>
              <div className={`absolute top-0 left-0 w-full h-3 ${isVictory ? 'bg-green-500 shadow-[0_5px_15px_#22c55e]' : 'bg-red-500 shadow-[0_5px_15px_#ef4444]'}`}></div>
              <div className="skew-box-inner flex flex-col items-center gap-6 text-center relative z-10">
                <span className="text-sm text-white/30 font-black tracking-[0.8em] uppercase">SÍNTESIS DEL ENCUENTRO</span>
                <div className="flex items-center gap-12">
                   <div className="flex flex-col items-center">
                     <span className="text-xs font-bold text-white/20 mb-2 tracking-widest uppercase">LOCAL</span>
                     <div className="text-9xl font-black italic text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">{gameState.goalsFor}</div>
                   </div>
                   <div className="text-4xl font-black text-white/10 italic">VS</div>
                   <div className="flex flex-col items-center">
                     <span className="text-xs font-bold text-white/20 mb-2 tracking-widest uppercase">VISITANTE</span>
                     <div className="text-9xl font-black italic text-hazard-red drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">{gameState.goalsAgainst}</div>
                   </div>
                </div>
                {isVictory ? (
                  <div className="mt-6 text-green-500 font-black italic tracking-widest text-2xl animate-pulse">¡RECONOCIDO COMO LEYENDA DEL ESTADIO!</div>
                ) : (
                  <div className="mt-6 text-hazard-red font-black italic tracking-widest text-2xl uppercase opacity-60">Falta de táctica en el mediocampo.</div>
                )}
              </div>
            </div>
            <button onClick={restart} className="btn-hard px-24 py-10 bg-green-500 text-black font-black uppercase italic text-4xl transition-all active:scale-95 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
               RE-INICIAR TEMPORADA
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center gap-12 py-12">
            {loading ? (
              <div className="text-center flex flex-col items-center gap-10">
                <div className="relative">
                   <div className="w-40 h-40 border-[15px] border-green-500/10 border-t-green-500 rounded-full animate-spin shadow-[0_0_50px_rgba(34,197,94,0.2)]" />
                   <Target size={56} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 animate-pulse" />
                </div>
                <div className="space-y-4">
                  <p className="text-3xl text-green-500 font-black uppercase tracking-[1em] animate-pulse italic">DECODIFICANDO JUGADA</p>
                  <p className="text-xs text-white/20 font-black uppercase tracking-[0.5em]">DIRECCIÓN TÉCNICA: PATXI MENDIBURU</p>
                </div>
              </div>
            ) : currentQuestion && (
              <>
                <div className="relative group">
                  <div className="absolute -inset-6 bg-green-500/10 blur-[60px] group-hover:bg-green-500/20 transition-all duration-1000"></div>
                  <div className="relative bg-black/90 border-l-[30px] border-green-500 p-12 md:p-16 skew-box shadow-[50px_50px_0_rgba(0,0,0,0.6)] border border-white/5 tactical-border">
                    <div className="skew-box-inner relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-8 text-green-500">
                        <Crosshair size={32} className="animate-spin-slow" /> 
                        <span className="text-sm font-black uppercase tracking-[0.8em] font-tech italic">OBJETIVO DETECTADO</span>
                      </div>
                      <h2 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase text-white leading-[0.85] tracking-tighter drop-shadow-2xl">
                        {currentQuestion.question}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = i === currentQuestion.correctAnswerIndex;
                    return (
                      <button
                        key={i}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleAnswer(i)}
                        className={`p-10 md:p-12 border-4 transition-all skew-box font-black uppercase italic text-2xl md:text-4xl shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden ${
                          selectedAnswer === null ? 'bg-black/60 border-white/10 text-green-500 hover:border-green-400 hover:-translate-y-3 hover:bg-green-500/10' :
                          isCorrect ? 'bg-green-500 border-white text-black scale-105 z-10 shadow-[20px_20px_80px_rgba(34,197,94,0.6)]' :
                          isSelected ? 'bg-red-600 border-red-400 text-white scale-95 opacity-100' : 'bg-black/40 border-transparent opacity-20 grayscale'
                        }`}
                      >
                        <span className="skew-box-inner flex justify-between items-center gap-6">
                          <span className="text-sm opacity-30 font-tech">OP_{i+1}</span>
                          <span className="flex-1 text-right leading-none tracking-tight">{opt}</span>
                          {selectedAnswer !== null && isCorrect && <CheckCircle2 size={40} className="shrink-0" />}
                          {selectedAnswer !== null && isSelected && !isCorrect && <XCircle size={40} className="shrink-0" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer !== null && (
                  <div className="animate-in slide-in-from-bottom-16 duration-700 space-y-10">
                    <div className="bg-black/95 border-l-[15px] border-green-500/50 p-10 flex gap-10 items-center skew-box shadow-[0_30px_100px_rgba(0,0,0,1)] tactical-border">
                      <div className="bg-green-500/10 p-6 rounded-full shrink-0 animate-pulse border border-green-500/20">
                        <Info className="text-green-500" size={56} />
                      </div>
                      <div className="skew-box-inner border-l-2 border-white/10 pl-10">
                        <span className="text-xs text-green-500 font-black uppercase tracking-[0.8em] mb-3 block italic">ANÁLISIS TÁCTICO DEL VAR</span>
                        <p className="text-xl md:text-3xl text-white font-black italic leading-none tracking-tighter uppercase max-w-4xl">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                    <button 
                      onClick={nextQuestion} 
                      className="btn-hard w-full py-10 md:py-12 bg-white text-black font-black uppercase italic skew-box transition-all flex items-center justify-center gap-8 group hover:bg-green-500"
                    >
                      <span className="skew-box-inner flex items-center gap-6 text-4xl md:text-5xl tracking-tighter">
                        {selectedAnswer === currentQuestion.correctAnswerIndex ? 'LANZAR ATAQUE' : 'RECUPERAR POSESIÓN'} 
                        <ChevronRight size={64} className="group-hover:translate-x-6 transition-transform" />
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="p-4 md:p-8 bg-black border-t-8 border-green-900 flex justify-between items-center z-50 sticky bottom-0">
         <div className="flex items-center gap-8 text-green-900 border-r-2 border-green-900/20 pr-10 md:pr-14">
            <Dribbble size={36} className="animate-spin-slow text-green-700" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.6em] text-green-800 leading-none mb-1">DATASTREAM ACTIVE</span>
              <span className="text-[10px] opacity-40 font-bold uppercase tracking-[0.3em]">SECURE CHANNEL: TRIVIA_CORE_V4</span>
            </div>
         </div>
         <div className="flex items-center gap-14">
            <div className="text-right">
               <span className="text-[10px] text-green-900 font-black uppercase tracking-[0.5em] block mb-1">ZONA DE OPERACIÓN</span>
               <div className="text-xl md:text-2xl text-green-500 font-black italic uppercase tracking-tighter leading-none glitch-text">
                  {gameState.category === 'torneos' ? 'TORNEOS ÉLITE' : (gameState.category?.toUpperCase() || 'STANDBY')}
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;
