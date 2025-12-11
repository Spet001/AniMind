import React, { useState, useEffect } from 'react';
import { 
  Search, Star, Info, ExternalLink, Tv, Calendar, AlertCircle, 
  Sparkles, Loader2, User, UserCircle, Bug, LogOut, Heart, 
  Globe, ChevronRight, Zap 
} from 'lucide-react';

// --- CONFIGURAÇÃO ---
const apiKey = ""; 
const MAL_CLIENT_ID = "85d7e179fe461e90b8cea22aef358cbe";
const CORS_PROXY = "https://corsproxy.io/?"; 
const MAL_BASE_URL = "https://api.myanimelist.net/v2";
const DEPLOY_URL = "https://gemini.google.com/share/6ae852210638";

// --- TRADUÇÕES ---
const TRANSLATIONS = {
  pt: {
    appTitle: "AniMind",
    malEdition: "MAL Edition",
    visitor: "Visitante",
    modeVisit: "Modo Visitante",
    logout: "Desconectar",
    hello: "Olá",
    discover: "Descubra Animes",
    descConnected: "Pronto para encontrar sua próxima obsessão baseada na sua lista do MAL?",
    descVisitor: "Use IA para analisar seu gosto ou conecte seu perfil MyAnimeList.",
    btnTaste: "Descrever Gosto",
    btnConnect: "Conectar MAL",
    placeholderText: "Ex: Animes de fantasia sombria com política...",
    placeholderUser: "Digite seu username do MyAnimeList",
    btnSearch: "Buscar",
    btnConnecting: "Conectar",
    btnRecommend: "Recomendar para Mim",
    loadingProfile: "Conectando à API Oficial do MAL...",
    loadingAI: "Consultando Inteligência Artificial...",
    loadingData: "Buscando capas e notas oficiais...",
    errorTitle: "Ops! Algo deu errado",
    errorPrivate: "Usuário não encontrado ou lista privada.",
    errorShortList: "Lista de animes muito curta para gerar recomendações precisas.",
    errorNoDetails: "Não conseguimos encontrar detalhes dos animes sugeridos no MAL.",
    cloudCta: "Não tem API key do Gemini? Utilizar deploy em nuvem!",
    cloudAuto: "Sem API key informada — carregando versão em nuvem.",
    cloudBack: "Voltar para usar minha API key",
    cloudEmbedTitle: "Deploy em nuvem (incorporado)",
    cardEpisodes: "eps",
    cardSynopsysUnavailable: "Sinopse indisponível.",
    readMore: "Ler mais",
    showLess: "Mostrar menos",
    quickPromptsTitle: "Experimente um destes:",
    prompts: [
      "Cyberpunk filosófico anos 90",
      "Romance escolar que faz chorar",
      "Isekai com protagonista OP",
      "Terror psicológico tenso",
      "Ação frenética estilo Studio Trigger",
      "Slice of Life relaxante (Iyashikei)"
    ]
  },
  en: {
    appTitle: "AniMind",
    malEdition: "MAL Edition",
    visitor: "Visitor",
    modeVisit: "Visitor Mode",
    logout: "Disconnect",
    hello: "Hello",
    discover: "Discover Anime",
    descConnected: "Ready to find your next obsession based on your MAL list?",
    descVisitor: "Use AI to analyze your taste or connect your MyAnimeList profile.",
    btnTaste: "Describe Taste",
    btnConnect: "Connect MAL",
    placeholderText: "Ex: Dark fantasy anime with politics...",
    placeholderUser: "Enter your MyAnimeList username",
    btnSearch: "Search",
    btnConnecting: "Connect",
    btnRecommend: "Recommend for Me",
    loadingProfile: "Connecting to Official MAL API...",
    loadingAI: "Consulting Artificial Intelligence...",
    loadingData: "Fetching covers and official scores...",
    errorTitle: "Oops! Something went wrong",
    errorPrivate: "User not found or list is private.",
    errorShortList: "Anime list too short for accurate recommendations.",
    errorNoDetails: "Could not find details for suggested anime on MAL.",
    cloudCta: "No Gemini API key? Use cloud deploy!",
    cloudAuto: "No API key provided — loading cloud version.",
    cloudBack: "Back to my API key",
    cloudEmbedTitle: "Cloud deploy (embedded)",
    cardEpisodes: "eps",
    cardSynopsysUnavailable: "Synopsis unavailable.",
    readMore: "Read more",
    showLess: "Show less",
    quickPromptsTitle: "Try one of these:",
    prompts: [
      "90s Philosophical Cyberpunk",
      "School romance that makes you cry",
      "Isekai with OP protagonist",
      "Tense psychological horror",
      "Frenetic action Studio Trigger style",
      "Relaxing Slice of Life (Iyashikei)"
    ]
  }
};

/**
 * Componente Principal do App
 */
export default function App() {
  const [lang, setLang] = useState('pt'); // 'pt' ou 'en'
  const hasApiKey = Boolean(apiKey && apiKey.trim());
  const [useCloudDeploy, setUseCloudDeploy] = useState(!hasApiKey);
  const [searchMode, setSearchMode] = useState('text'); 
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); 
  const [error, setError] = useState(null);
  const [debugLink, setDebugLink] = useState(null); 
  const [connectedUser, setConnectedUser] = useState(null);

  // Detectar idioma do navegador ao iniciar
  useEffect(() => {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('en')) {
      setLang('en');
    }
    
    // Carregar usuário salvo
    const savedUser = localStorage.getItem('aniMindUser_MAL');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setConnectedUser(user);
        setSearchMode('mal_user');
      } catch (e) {
        localStorage.removeItem('aniMindUser_MAL');
      }
    }
  }, []);

  // Helper de tradução
  const t = (key) => TRANSLATIONS[lang][key] || key;
  const currentPrompts = TRANSLATIONS[lang].prompts;

  const toggleLanguage = () => setLang(prev => prev === 'pt' ? 'en' : 'pt');

  // --- LÓGICA DE API (Mantida e Otimizada) ---
  
  const delayPromise = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchMAL = async (endpoint, retries = 3) => {
    const targetUrl = `${MAL_BASE_URL}${endpoint}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(proxyUrl, {
          headers: { 'X-MAL-CLIENT-ID': MAL_CLIENT_ID }
        });

        if (response.status === 403 || response.status === 401) throw new Error("Erro de Permissão.");
        if (response.status === 404) return null;
        
        if (!response.ok) {
           if (response.status >= 500 || response.status === 429) throw new Error(`Server error: ${response.status}`);
           throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await delayPromise(1000);
      }
    }
  };

  const handleConnectUser = async (username) => {
    if (!username.trim()) return;
    setLoading(true);
    setLoadingStep('profile');
    setError(null);
    
    try {
      const data = await fetchMAL(`/users/${username}/animelist?limit=1`);
      if (!data) throw new Error(t('errorPrivate'));
      
      const userData = {
        username: username,
        image_url: null,
        url: `https://myanimelist.net/profile/${username}`
      };
      
      setConnectedUser(userData);
      localStorage.setItem('aniMindUser_MAL', JSON.stringify(userData));
      setSearchMode('mal_user');
      setQuery('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleLogout = () => {
    setConnectedUser(null);
    localStorage.removeItem('aniMindUser_MAL');
    setSearchMode('text');
    setRecommendations([]);
    setError(null);
  };

  const fetchUserTopAnimes = async (username) => {
    setLoadingStep('profile');
    setDebugLink(null);
    const endpoint = `/users/${username}/animelist?sort=list_score&status=completed&limit=30&fields=list_status`;
    
    try {
      const data = await fetchMAL(endpoint);
      if (!data || !data.data || data.data.length === 0) {
        const fallbackEndpoint = `/users/${username}/animelist?sort=list_score&limit=30`;
        const fallbackData = await fetchMAL(fallbackEndpoint);
        if (!fallbackData || !fallbackData.data || fallbackData.data.length === 0) {
             throw new Error(t('errorPrivate'));
        }
        return fallbackData.data.map(item => item.node.title);
      }
      return data.data.map(item => item.node.title);
    } catch (err) {
      setDebugLink(`${MAL_BASE_URL}${endpoint}`);
      throw err;
    }
  };

  const getGeminiRecommendations = async (userQuery, isProfileSearch = false) => {
    setLoadingStep('ai');
    let promptContext = userQuery;
    
    const languageInstruction = lang === 'pt' 
      ? "Note: The user speaks Portuguese, but ALWAYS return Anime Titles in their official MAL English/Romaji format." 
      : "Note: The user speaks English.";

    if (isProfileSearch) {
        promptContext = `
            User's MAL favorites: ${userQuery}.
            Analyze taste and recommend 12 NEW animes.
            NEVER recommend anime already in the list.
        `;
    } else {
        promptContext = `
            User description/request: "${userQuery}".
            Recommend 12 animes that strictly match this theme/genre/request.
        `;
    }
    
    const systemPrompt = `
      You are an Anime Expert. Return ONLY a JSON Array with 12 strings of exact anime titles (MyAnimeList standard).
      Ex: ["Frieren: Beyond Journey's End", "Steins;Gate", "Monster", "Pluto", ...]
      ${languageInstruction}
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptContext }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
          }),
        }
      );

      if (!response.ok) throw new Error("AI Error");
      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No AI response");

      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text);
    } catch (err) {
      console.error(err);
      throw new Error("AI Recommendation Failed.");
    }
  };

  const fetchAnimeMetadata = async (titles) => {
    setLoadingStep('data');
    const fetchPromises = titles.map(async (title) => {
      try {
        await delayPromise(Math.random() * 1000);
        const endpoint = `/anime?q=${encodeURIComponent(title)}&limit=1&fields=id,title,main_picture,mean,synopsis,genres,media_type,start_date,status,num_episodes`;
        const data = await fetchMAL(endpoint);
        if (data && data.data && data.data.length > 0) return data.data[0].node;
        return null;
      } catch (e) { return null; }
    });
    const results = await Promise.all(fetchPromises);
    return results.filter(i => i !== null);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const targetQuery = (searchMode === 'mal_user' && connectedUser) ? connectedUser.username : query;
    if (!targetQuery.trim()) return;

    setLoading(true);
    setError(null);
    setRecommendations([]);
    setDebugLink(null);

    try {
      let contextForAI = targetQuery;
      if (searchMode === 'mal_user') {
        const topAnimes = await fetchUserTopAnimes(targetQuery);
        if (topAnimes.length < 3) throw new Error(t('errorShortList'));
        contextForAI = topAnimes.slice(0, 30).join(", "); 
      }
      const titles = await getGeminiRecommendations(contextForAI, searchMode === 'mal_user');
      const details = await fetchAnimeMetadata(titles);
      
      if (details.length === 0) setError(t('errorNoDetails'));
      else setRecommendations(details);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const fillQuery = (text) => {
    setQuery(text);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500 selection:text-white pb-20 overflow-x-hidden text-slate-100">
      
      {/* --- BACKGROUND SYSTEM --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          {/* 1. Imagem de Fundo (Arte) */}
          <div className="absolute inset-0 z-0">
             <img 
               src="https://wp.ufpel.edu.br/artenosul/files/2017/11/Sara1-e1510566531201.jpg" 
               alt="Background Art" 
               className="w-full h-full object-cover"
             />
          </div>

          {/* 2. Sobreposição Azul (Mantendo a identidade mas permitindo a imagem aparecer) */}
          {/* Gradiente azul escuro para garantir legibilidade do texto */}
          <div className="absolute inset-0 z-1 bg-slate-950/85 mix-blend-multiply"></div>
          <div className="absolute inset-0 z-1 bg-blue-900/40 mix-blend-overlay"></div>

          {/* 3. Animação de Ondas (Liquid Motion) */}
          <div className="absolute inset-0 z-2 overflow-hidden opacity-30">
             {/* Onda 1 */}
             <div 
               className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-[40%] bg-gradient-to-tr from-blue-600/20 to-transparent animate-wave" 
               style={{animationDuration: '25s'}}
             />
             {/* Onda 2 */}
             <div 
               className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-[45%] bg-gradient-to-bl from-indigo-600/20 to-transparent animate-wave" 
               style={{animationDuration: '35s', animationDirection: 'reverse'}}
             />
             {/* Onda 3 (Fundo) */}
             <div 
               className="absolute bottom-[-50%] right-[-50%] w-[150%] h-[150%] rounded-[35%] bg-gradient-to-t from-cyan-900/30 to-transparent animate-wave" 
               style={{animationDuration: '45s'}}
             />
          </div>
      </div>

      {/* Styles for Wave Animation */}
      <style>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-wave {
          animation: wave linear infinite;
        }
      `}</style>
      
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-slate-950/60 border-b border-white/5 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block tracking-tight">
              {t('appTitle')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Language Toggle */}
             <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
             >
                <Globe className="w-3.5 h-3.5" />
                {lang.toUpperCase()}
             </button>

            {/* User Profile */}
            {connectedUser ? (
              <div className="flex items-center gap-3 bg-slate-900/80 pl-1 pr-3 py-1 rounded-full border border-white/10 hover:border-blue-500/30 transition-all group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold shadow-md">
                    {connectedUser.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-300 hidden sm:block group-hover:text-white transition-colors">{connectedUser.username}</span>
                <button 
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-full ml-1"
                  title={t('logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                {t('modeVisit')}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-32 pb-12 relative z-10">
        <div className="text-center mb-12 space-y-6">
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-lg">
            {connectedUser ? `${t('hello')}, ${connectedUser.username}!` : t('discover')}
          </h2>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 drop-shadow-md">
            {connectedUser ? t('descConnected') : t('descVisitor')}
          </p>

          {/* Cloud deploy CTA */}
          <div className="flex flex-col items-center gap-3 mt-4">
            {!useCloudDeploy && (
              <button
                onClick={() => setUseCloudDeploy(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/90 text-slate-900 font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:-translate-y-[1px]"
              >
                <Zap className="w-4 h-4" /> {t('cloudCta')}
              </button>
            )}
            {useCloudDeploy && (
              <div className="text-xs text-amber-200/90 bg-amber-500/15 border border-amber-500/30 px-4 py-2 rounded-full backdrop-blur-md">
                {hasApiKey ? t('cloudCta') : t('cloudAuto')}
              </div>
            )}
          </div>

          {!useCloudDeploy && (
            <>
              {/* Mode Toggles (Only if not connected) */}
              {!connectedUser && (
                <div className="flex justify-center gap-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <button
                        onClick={() => { setSearchMode('text'); setError(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 backdrop-blur-md ${
                            searchMode === 'text' 
                            ? 'bg-white/90 text-slate-950 shadow-xl shadow-white/10 scale-105' 
                            : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-white/10'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" /> {t('btnTaste')}
                    </button>
                    <button
                        onClick={() => { setSearchMode('mal_user'); setError(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 backdrop-blur-md ${
                            searchMode === 'mal_user' 
                            ? 'bg-[#2E51A2] text-white shadow-xl shadow-[#2E51A2]/30 scale-105' 
                            : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-white/10'
                        }`}
                    >
                        <UserCircle className="w-4 h-4" /> {t('btnConnect')}
                    </button>
                </div>
              )}
            </>
          )}

          {/* Search / Cloud area */}
          <div className="max-w-5xl mx-auto mt-10 animate-in fade-in zoom-in-95 duration-1000 delay-300">
            {useCloudDeploy ? (
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{t('cloudEmbedTitle')}</p>
                    <p className="text-xs text-slate-300">{DEPLOY_URL}</p>
                  </div>
                  {hasApiKey && (
                    <button
                      onClick={() => setUseCloudDeploy(false)}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 hover:bg-slate-700/80 hover:border-indigo-400/40 transition-all text-slate-200"
                    >
                      {t('cloudBack')}
                    </button>
                  )}
                </div>
                <div className="aspect-video w-full bg-black/60">
                  <iframe
                    title="Cloud Deploy"
                    src={DEPLOY_URL}
                    className="w-full h-full border-0"
                    allow="clipboard-write; fullscreen"
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {!connectedUser ? (
                    <div className="space-y-4">
                      <form onSubmit={(e) => { e.preventDefault(); if(searchMode === 'mal_user') handleConnectUser(query); else handleSearch(e); }} className="relative group">
                          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                              {searchMode === 'text' ? (
                                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300" />
                              ) : (
                                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                              )}
                          </div>
                          <input
                              type="text"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder={searchMode === 'text' ? t('placeholderText') : t('placeholderUser')}
                              className="w-full pl-14 pr-36 py-5 bg-slate-900/70 backdrop-blur-lg border border-white/10 rounded-3xl outline-none text-white placeholder-slate-400 transition-all duration-300 shadow-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-white/20 focus:bg-slate-900/90 focus:shadow-indigo-500/20"
                              disabled={loading}
                          />
                          <button
                              type="submit"
                              disabled={loading || !query.trim()}
                              className={`absolute right-2.5 top-2.5 bottom-2.5 px-6 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                                  loading || !query.trim() 
                                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                                  : searchMode === 'text'
                                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                              }`}
                          >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (searchMode === 'mal_user' ? t('btnConnecting') : t('btnSearch'))}
                          </button>
                      </form>

                      {/* Pre-made Prompts (Chips) */}
                      {searchMode === 'text' && !loading && recommendations.length === 0 && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                          <p className="text-xs text-slate-300/80 mb-3 font-medium uppercase tracking-widest">{t('quickPromptsTitle')}</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {currentPrompts.map((prompt, idx) => (
                              <button
                                key={idx}
                                onClick={() => fillQuery(prompt)}
                                className="px-4 py-2 bg-slate-900/40 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-white text-slate-300 text-sm rounded-xl transition-all duration-200 backdrop-blur-md"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                ) : (
                    <div className="flex justify-center perspective-1000">
                      <button
                          onClick={handleSearch}
                          disabled={loading}
                          className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-12 py-5 rounded-3xl font-bold text-lg shadow-[0_20px_50px_-12px_rgba(79,70,229,0.3)] transition-all duration-500 transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 overflow-hidden"
                      >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out rounded-3xl"></div>
                          <div className="relative flex items-center gap-3">
                              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Heart className="w-6 h-6 fill-white/20 group-hover:fill-white/40 transition-colors" /> {t('btnRecommend')}</>}
                          </div>
                      </button>
                    </div>
                )}
              </div>
            )}
          </div>

          {/* Loading Steps */}
          {loading && (
            <div className="flex flex-col items-center gap-4 mt-12 animate-in fade-in duration-500">
                <div className="p-4 bg-slate-900/80 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3 text-sm text-indigo-300 font-medium">
                      <div className="relative">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping absolute inset-0 opacity-75"></div>
                        <div className="w-3 h-3 bg-indigo-500 rounded-full relative"></div>
                      </div>
                      <span>
                          {loadingStep === 'profile' && t('loadingProfile')}
                          {loadingStep === 'ai' && t('loadingAI')}
                          {loadingStep === 'data' && t('loadingData')}
                      </span>
                  </div>
                </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-6 py-4 rounded-2xl max-w-xl mx-auto flex flex-col gap-2 mt-8 text-left backdrop-blur-md shadow-lg animate-in shake duration-300">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-400" />
                <p className="font-bold text-red-100">{t('errorTitle')}</p>
              </div>
              <p className="text-sm text-red-200/80 ml-9">{error}</p>
              {debugLink && (
                  <div className="ml-9 mt-1 text-[10px] text-red-300/50 break-all font-mono bg-black/20 p-2 rounded">
                    <Bug className="w-3 h-3 inline mr-1" />
                    {debugLink}
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Results Grid */}
        {!loading && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
            {recommendations.map((anime, index) => (
              <AnimeCard key={anime.id} anime={anime} index={index} lang={lang} t={t} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Componente do Card de Anime
 */
function AnimeCard({ anime, index, t }) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mapeamento
  const title = anime.title;
  const image = anime.main_picture?.large || anime.main_picture?.medium;
  const score = anime.mean || "N/A";
  const synopsis = anime.synopsis || t('cardSynopsysUnavailable');
  const genres = anime.genres ? anime.genres.map(g => g.name).slice(0, 2).join(" • ") : "Anime";
  const episodes = anime.num_episodes || "?";
  const year = anime.start_date ? anime.start_date.split('-')[0] : "";
  const malUrl = `https://myanimelist.net/anime/${anime.id}`;

  const displaySynopsis = expanded ? synopsis : synopsis.slice(0, 140) + (synopsis.length > 140 ? "..." : "");

  return (
    <div 
      className="group relative bg-slate-900/80 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-full"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Header with Gradient Overlay */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-90" />
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Floating Badge */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-500/20 shadow-lg">
          <Star className="w-3.5 h-3.5 fill-current" />
          {score}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 pt-2 flex flex-col flex-grow relative z-20 -mt-12">
        {/* Metadata Row */}
        <div className="flex items-center gap-3 mb-3 text-[10px] font-bold tracking-wide uppercase text-slate-400">
           <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5">{anime.media_type?.toUpperCase() || 'TV'}</span>
           {year && <span>{year}</span>}
           <span className="text-indigo-400">{genres}</span>
        </div>

        {/* Title */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3 className="font-bold text-xl text-white leading-tight line-clamp-2 group-hover:text-indigo-300 transition-colors duration-300">
            {title}
          </h3>
          <a 
            href={malUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full hover:bg-indigo-600"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Synopsis */}
        <div className="text-sm text-slate-400 leading-relaxed mb-4 flex-grow">
          <p>{displaySynopsis}</p>
          {synopsis.length > 140 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-indigo-400 text-xs hover:text-white mt-1 font-bold inline-flex items-center gap-1 transition-all"
            >
              {expanded ? t('showLess') : t('readMore')} <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
             <Tv className="w-3.5 h-3.5" />
             {episodes} {t('cardEpisodes')}
          </span>
          <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${anime.status === 'finished_airing' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
             {anime.status ? anime.status.replace(/_/g, ' ') : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}