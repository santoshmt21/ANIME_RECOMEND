import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bgVideo from './YOURNAME.mp4';
import demonVideo from './DEMON.mp4';
import authorPhoto from './AUTHOR.png';
import animeDataset from './anime_data_with_trailers.json';

const localPosterModules = import.meta.glob('./MOVIES/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

const localVideoModules = import.meta.glob('./MOVIES/**/*.mp4', {
  eager: true,
  import: 'default',
});

const normalizeKey = (value) =>
  (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const toKeyCandidates = (title) => {
  const base = title || '';
  const noSubtitle = base.split(':')[0] || base;
  const noParen = base.replace(/\(.*?\)/g, '');
  const noLeadingArticle = base.replace(/^(the|a|an)\s+/i, '');

  return Array.from(
    new Set([
      normalizeKey(base),
      normalizeKey(noSubtitle),
      normalizeKey(noParen),
      normalizeKey(noLeadingArticle),
    ])
  ).filter(Boolean);
};

const buildLocalAssetMap = (modules) => {
  const map = new Map();

  for (const [path, asset] of Object.entries(modules)) {
    const segments = path.split('/');
    const file = segments[segments.length - 1] || '';
    const folder = segments[segments.length - 2] || '';
    const fileBase = file.replace(/\.[^.]+$/, '');
    const keys = [
      normalizeKey(fileBase),
      normalizeKey(fileBase.replace(/_/g, ' ')),
      normalizeKey(folder),
      normalizeKey(folder.replace(/_/g, ' ')),
    ].filter(Boolean);

    keys.forEach((key) => {
      if (!map.has(key)) {
        map.set(key, asset);
      }
    });
  }

  return map;
};

const localPosterMap = buildLocalAssetMap(localPosterModules);
const localVideoMap = buildLocalAssetMap(localVideoModules);

const pickLocalAsset = (title, assetMap) => {
  const candidates = toKeyCandidates(title);

  for (const key of candidates) {
    if (assetMap.has(key)) {
      return assetMap.get(key);
    }
  }

  let bestMatch = null;
  for (const [assetKey, assetValue] of assetMap.entries()) {
    for (const candidate of candidates) {
      if (candidate.includes(assetKey) || assetKey.includes(candidate)) {
        if (!bestMatch || assetKey.length > bestMatch.key.length) {
          bestMatch = { key: assetKey, value: assetValue };
        }
      }
    }
  }

  return bestMatch ? bestMatch.value : null;
};

const fallbackPoster = (title) =>
  `https://picsum.photos/seed/${encodeURIComponent(title)}/800/1200`;

const toEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
};

const mapDatasetEntry = (entry, listName) => {
  const localPoster = pickLocalAsset(entry.title_english, localPosterMap);
  const localVideo = pickLocalAsset(entry.title_english, localVideoMap);

  return {
    id: `${listName}-${entry.rank}`,
    title: entry.title_english,
    jpTitle: entry.title_japanese,
    genre: entry.genres || [],
    rating: entry.rating,
    image: localPoster || fallbackPoster(entry.title_english),
    backgroundVideo: localVideo,
    description: entry.description,
    trailer: toEmbedUrl(entry.trailer_link),
  };
};

const trendingAnime = animeDataset.top_100_trending.map((entry) =>
  mapDatasetEntry(entry, 'trending')
);

const topRatedAnime = animeDataset.top_100_rated.map((entry) =>
  mapDatasetEntry(entry, 'rated')
);

const allAnime = Array.from(
  new Map([...trendingAnime, ...topRatedAnime].map((anime) => [anime.title, anime])).values()
);

const SearchPageView = ({
  NavbarComponent,
  AnimeCardComponent,
  filteredAnime,
  genres,
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen bg-black pt-14 sm:pt-16 md:pt-20"
  >
    <NavbarComponent />

    <div className="px-3 sm:px-6 md:px-20 py-8 sm:py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4">
          検索 • Search Anime
        </h1>

        <div className="relative mb-6 sm:mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or Japanese name..."
            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <svg className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 mb-8 sm:mb-12 overflow-x-auto pb-2 scrollbar-hide">
          {genres.map((genre) => (
            <motion.button
              key={genre}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold whitespace-nowrap text-xs sm:text-sm md:text-base transition-all ${
                selectedGenre === genre
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {genre}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {filteredAnime.length > 0 ? (
            filteredAnime.map((anime, i) => (
              <AnimeCardComponent key={anime.id} anime={anime} delay={i * 0.05} />
            ))
          ) : (
            <div className="col-span-full text-center py-16 sm:py-20">
              <p className="text-gray-500 text-base sm:text-xl">見つかりません • No results found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const AnimeWebsite = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthorInfo, setShowAuthorInfo] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('animeFavorites');
    if (saved) setFavorites(JSON.parse(saved));
    
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (animeId) => {
    const newFavorites = favorites.includes(animeId)
      ? favorites.filter(id => id !== animeId)
      : [...favorites, animeId];
    setFavorites(newFavorites);
    localStorage.setItem('animeFavorites', JSON.stringify(newFavorites));
  };

  // Filter anime
  const filteredAnime = allAnime.filter(anime => {
    const matchesSearch = anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         anime.jpTitle.includes(searchQuery);
    const matchesGenre = selectedGenre === 'All' || anime.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const genres = [
    'All',
    ...Array.from(new Set(allAnime.flatMap((anime) => anime.genre))).sort(),
  ];

  // LANDING PAGE
  const LandingPage = () => {
    // Reduce particles on mobile for better performance
    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 30;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
        className="min-h-screen relative overflow-hidden bg-black"
      >
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={bgVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Animated Overlay */}
        <div className="absolute inset-0">
          {/* Floating Particles */}
          {[...Array(particleCount)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-500 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: Math.random() * 0.5 + 0.3,
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                opacity: [null, 0, Math.random() * 0.5 + 0.3],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 md:px-6">
          {/* Japanese Text Accent */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.15, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="absolute top-10 sm:top-16 md:top-20 text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-bold text-purple-500 select-none"
            style={{ fontFamily: 'serif' }}
          >
            アニメ
          </motion.div>

          {/* Main Title */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black text-center mb-4 sm:mb-6 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <motion.span
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% auto' }}
            >
              {['D', 'i', 's', 'c', 'o', 'v', 'e', 'r'].map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
                  className="inline-block"
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: Math.random() * 20 - 10,
                    transition: { duration: 0.3 }
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.span>
            <br />
            <motion.span
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.8 }}
            >
              Your Next Anime
            </motion.span>
            
            {/* Glowing effect */}
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur-3xl opacity-30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-sm sm:text-base md:text-xl lg:text-2xl text-gray-400 text-center mb-8 sm:mb-10 md:mb-12 max-w-2xl px-4"
          >
            <span className="text-pink-500 font-bold">探索 • 発見 • 楽しむ</span>
            <br />
            Explore thousands of anime. Find your perfect match.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('home')}
            className="group relative px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold text-white overflow-hidden rounded-full"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% auto' }}
            />
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0, 0.5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
              }}
            />
            <span className="relative z-10 flex items-center gap-2">
              始める • Get Started
              <motion.svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </span>
          </motion.button>

          {/* Floating Anime Cards Preview */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {trendingAnime.slice(0, 3).map((anime, i) => (
              <motion.div
                key={anime.id}
                className="absolute w-40 h-60 rounded-lg overflow-hidden shadow-2xl opacity-20"
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 40 - 20,
                }}
                animate={{
                  y: [null, -100],
                  rotate: [null, Math.random() * 40 - 20],
                  x: [null, Math.random() * window.innerWidth],
                }}
                transition={{
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 2,
                }}
              >
                <img src={anime.image} alt={anime.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent" />
              </motion.div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 2, duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
          >
            <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm">下へスクロール</span>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // NAVBAR
  const Navbar = () => (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer"
          onClick={() => setCurrentPage('home')}
        >
          アニメ<span className="text-white">HUB</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-6 md:gap-8">
          {['Home', 'Search', 'Recommendations'].map((item) => (
            <motion.button
              key={item}
              whileHover={{ scale: 1.1, color: '#ec4899' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(item.toLowerCase())}
              className="text-gray-300 text-sm md:text-base font-medium transition-colors"
            >
              {item}
            </motion.button>
          ))}
        </div>

        {/* Mobile Menu Items */}
        <div className="md:hidden flex items-center gap-3">
          {['Home', 'Search', 'Recommendations'].map((item) => (
            <motion.button
              key={`mobile-${item}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(item.toLowerCase())}
              className="text-xs text-gray-300 font-medium"
            >
              {item.charAt(0)}
            </motion.button>
          ))}
        </div>

        {/* Developer Info Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAuthorInfo(true)}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-bold text-pink-400"
          aria-label="Open developer info"
          title="Developer Info"
        >
          D
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold cursor-pointer text-xs sm:text-sm">
            {favorites.length}
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-pink-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </motion.nav>
  );

  // AUTHOR INFO MODAL
  const AuthorInfo = () => (
    <AnimatePresence>
      {showAuthorInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAuthorInfo(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAuthorInfo(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              ✕
            </motion.button>

            {/* Author Photo */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <img
                  src={authorPhoto}
                  alt="Sandy - Developer"
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white/30 relative z-10 shadow-2xl"
                />
              </motion.div>
            </div>

            {/* Author Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-3xl sm:text-4xl font-black mb-3 relative inline-block">
                <span className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-30 -z-10"></span>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  ✨ SANDY M T ✨
                </span>
              </h2>
              
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                I'm a passionate developer focused on building intelligent and visually engaging web applications. This anime recommendation platform combines modern UI design with smart data-driven suggestions to help users discover the best anime effortlessly.
              </p>

              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6 italic">
                I enjoy working with React, AI integrations, and creating smooth, interactive user experiences. My goal is to build applications that are not just functional, but memorable.
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {['React', 'Framer Motion', 'Tailwind', 'AI/ML'].map((tech) => (
                  <motion.span
                    key={tech}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium"
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthorInfo(false)}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-white transition-all"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ANIME CARD
  const AnimeCard = ({ anime, delay = 0 }) => {
    const isFavorite = favorites.includes(anime.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
        whileHover={{ y: -10 }}
        className="group relative cursor-pointer"
        onClick={() => {
          setSelectedAnime(anime);
          setCurrentPage('details');
        }}
      >
        <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-gray-900">
          <img
            src={anime.image}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Info on Hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">{anime.title}</h3>
            <p className="text-pink-400 text-xs sm:text-sm mb-2">{anime.jpTitle}</p>
            <div className="flex items-center gap-1 mb-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1 text-yellow-400">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="font-bold">{anime.rating}</span>
              </div>
              <div className="flex gap-1">
                {anime.genre.slice(0, 1).map((g, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-purple-500/30 rounded-full text-purple-300 text-xs">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(anime.id);
            }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <motion.svg
              className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorite ? 'fill-pink-500' : 'fill-none'} stroke-pink-500`}
              viewBox="0 0 24 24"
              strokeWidth={2}
              animate={isFavorite ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </motion.svg>
          </motion.button>

          {/* Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 via-transparent to-transparent" />
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl blur-xl opacity-50" />
          </div>
        </div>

        {/* Title Below */}
        <div className="mt-2 sm:mt-3">
          <h4 className="text-white font-bold truncate text-sm sm:text-base">{anime.title}</h4>
          <p className="text-gray-500 text-xs sm:text-sm">{anime.jpTitle}</p>
        </div>
      </motion.div>
    );
  };

  // HOME PAGE
  const HomePage = () => {
    const [showAllTrending, setShowAllTrending] = useState(false);
    const [showAllRated, setShowAllRated] = useState(false);
    const featuredAnime = trendingAnime[0] || allAnime[0];
    const visibleTrending = showAllTrending ? trendingAnime : trendingAnime.slice(0, 8);
    const visibleTopRated = showAllRated ? topRatedAnime : topRatedAnime.slice(0, 8);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-black pt-14 sm:pt-16 md:pt-20"
      >
        <Navbar />

        {/* Hero Section */}
        <motion.section
          className="relative h-64 sm:h-80 md:h-[80vh] overflow-hidden"
        >
          <div className="absolute inset-0">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={demonVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          <div className="relative z-10 h-full flex items-center px-3 sm:px-6 md:px-20">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-pink-500 text-xs sm:text-sm font-bold mb-3 sm:mb-4 tracking-widest"
              >
                今週の注目 • FEATURED THIS WEEK
              </motion.p>
              
              <motion.h2
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-2 sm:mb-4"
              >
                {featuredAnime.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-lg sm:text-2xl md:text-3xl text-purple-400 mb-4 sm:mb-6 font-serif"
              >
                {featuredAnime.jpTitle}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-gray-300 text-xs sm:text-base md:text-lg mb-4 sm:mb-8 max-w-xl line-clamp-3 sm:line-clamp-none"
              >
                {featuredAnime.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-2 sm:gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAnime(featuredAnime);
                    setCurrentPage('details');
                  }}
                  className="px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  見る • Watch
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm rounded-lg font-bold text-white border border-white/20 text-sm sm:text-base"
                >
                  詳細 • Info
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* Decorative Japanese Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-9xl font-black text-white select-none pointer-events-none"
            style={{ writingMode: 'vertical-rl', fontFamily: 'serif' }}
          >
            最高のアニメ
          </motion.div>
        </motion.section>

        {/* Trending Section */}
        <section className="px-3 sm:px-6 md:px-20 py-8 sm:py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2">Trending Now</h3>
                <p className="text-pink-500 text-xs sm:text-sm md:text-base font-bold">トレンド中 • Most Popular</p>
              </div>
              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllTrending((prev) => !prev)}
                className="text-purple-400 text-xs sm:text-sm md:text-base font-bold flex items-center gap-2"
              >
                {showAllTrending ? 'Show Top 8' : 'View All'}
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {visibleTrending.map((anime, i) => (
                <AnimeCard key={anime.id} anime={anime} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Top Rated Section */}
        <section className="px-3 sm:px-6 md:px-20 py-8 sm:py-12 md:py-16 bg-gradient-to-b from-transparent to-purple-900/10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2">Top Rated</h3>
                <p className="text-pink-500 text-xs sm:text-sm md:text-base font-bold">最高評価 • Highest Scores</p>
              </div>
              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllRated((prev) => !prev)}
                className="text-purple-400 text-xs sm:text-sm md:text-base font-bold flex items-center gap-2"
              >
                {showAllRated ? 'Show Top 8' : 'View All'}
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {visibleTopRated.map((anime, i) => (
                <AnimeCard key={anime.id} anime={anime} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>
        </section>
      </motion.div>
    );
  };

  // DETAILS PAGE
  const DetailsPage = () => {
    if (!selectedAnime) return null;
    const detailBackground = selectedAnime.backgroundVideo || selectedAnime.image;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-black pt-14 sm:pt-16 md:pt-20"
      >
        <Navbar />

        {/* Hero Section */}
        <div className="relative h-80 sm:h-96 md:h-screen">
          {selectedAnime.backgroundVideo ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={detailBackground} type="video/mp4" />
            </video>
          ) : (
            <motion.img
              src={selectedAnime.image}
              alt={selectedAnime.title}
              className="absolute inset-0 w-full h-full object-cover"
              transition={{ duration: 1.5 }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />

          <div className="relative z-10 h-full flex items-end px-3 sm:px-6 md:px-20 pb-6 sm:pb-12 md:pb-20">
            <div className="max-w-3xl">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -5 }}
                onClick={() => setCurrentPage('home')}
                className="text-gray-400 mb-4 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm md:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                戻る • Back
              </motion.button>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white mb-2 sm:mb-4"
              >
                {selectedAnime.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-purple-400 mb-4 sm:mb-6 font-serif"
              >
                {selectedAnime.jpTitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6"
              >
                <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm md:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="font-bold text-yellow-400">{selectedAnime.rating}</span>
                </div>

                {selectedAnime.genre.slice(0, 3).map((g, i) => (
                  <span key={i} className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 bg-purple-500/30 backdrop-blur-sm rounded-full text-purple-300 font-bold text-xs sm:text-sm md:text-base">
                    {g}
                  </span>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-300 text-xs sm:text-base md:text-xl mb-4 sm:mb-8 leading-relaxed max-w-xl line-clamp-4 sm:line-clamp-none"
              >
                {selectedAnime.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-2 sm:gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 sm:px-8 py-2 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  再生 • Play
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFavorite(selectedAnime.id)}
                  className={`px-4 sm:px-8 py-2 sm:py-4 ${favorites.includes(selectedAnime.id) ? 'bg-pink-600' : 'bg-white/10'} backdrop-blur-sm rounded-lg font-bold text-white border border-white/20 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  {favorites.includes(selectedAnime.id) ? '保存' : '追加'}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trailer Section */}
        <section className="px-3 sm:px-6 md:px-20 py-8 sm:py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-4 sm:mb-6">
              予告編 • Trailer
            </h3>
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
              {selectedAnime.trailer ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={selectedAnime.trailer}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm sm:text-base md:text-lg">
                  Trailer link unavailable for this title
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </motion.div>
    );
  };

  // RECOMMENDATIONS PAGE
  const RecommendationsPage = () => {
    const [selectedMood, setSelectedMood] = useState(null);
    const moods = [
      { name: 'Action-Packed', jp: 'アクション満載', emoji: '⚔️', genres: ['Action'] },
      { name: 'Emotional', jp: '感動的', emoji: '😢', genres: ['Drama', 'Romance'] },
      { name: 'Mind-Bending', jp: '頭脳戦', emoji: '🧠', genres: ['Mystery', 'Thriller'] },
      { name: 'Lighthearted', jp: '楽しい', emoji: '😄', genres: ['Comedy', 'Adventure'] },
    ];

    const recommended = selectedMood
      ? allAnime.filter(anime => anime.genre.some(g => selectedMood.genres.includes(g)))
      : [];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-black pt-14 sm:pt-16 md:pt-20"
      >
        <Navbar />

        <div className="px-3 sm:px-6 md:px-20 py-8 sm:py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 sm:mb-4">
              おすすめ • Recommendations
            </h1>
            <p className="text-gray-400 text-xs sm:text-base md:text-xl mb-8 sm:mb-12">
              あなたの気分に合わせて • Choose your mood
            </p>

            {/* Mood Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-6 mb-12 sm:mb-16">
              {moods.map((mood, i) => (
                <motion.button
                  key={mood.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(mood)}
                  className={`p-4 sm:p-6 md:p-8 rounded-2xl text-center transition-all ${
                    selectedMood?.name === mood.name
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl sm:text-4xl md:text-6xl mb-2 sm:mb-3 md:mb-4">{mood.emoji}</div>
                  <h3 className="text-base sm:text-lg md:text-2xl font-bold text-white mb-1 sm:mb-2">{mood.name}</h3>
                  <p className="text-purple-300 text-xs sm:text-sm md:text-base">{mood.jp}</p>
                </motion.button>
              ))}
            </div>

            {/* Recommended Anime */}
            <AnimatePresence mode="wait">
              {recommended.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-6 sm:mb-8">
                    Perfect for {selectedMood.name} mood
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                    {recommended.map((anime, i) => (
                      <AnimeCard key={anime.id} anime={anime} delay={i * 0.1} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // LOADING SCREEN
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
          />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            読み込み中...
          </h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <AnimatePresence mode="wait">
        {currentPage === 'landing' && <LandingPage key="landing" />}
        {currentPage === 'home' && <HomePage key="home" />}
        {currentPage === 'details' && <DetailsPage key="details" />}
        {currentPage === 'search' && (
          <SearchPageView
            key="search"
            NavbarComponent={Navbar}
            AnimeCardComponent={AnimeCard}
            filteredAnime={filteredAnime}
            genres={genres}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
          />
        )}
        {currentPage === 'recommendations' && <RecommendationsPage key="recommendations" />}
      </AnimatePresence>
      <AuthorInfo />
    </div>
  );
};

export default AnimeWebsite;