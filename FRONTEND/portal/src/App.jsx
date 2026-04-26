import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bgVideo from './YOURNAME.mp4';
import demonVideo from './DEMON.mp4';
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

const AnimeWebsite = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
          {[...Array(30)].map((_, i) => (
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
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          {/* Japanese Text Accent */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.15, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="absolute top-20 text-9xl font-bold text-purple-500 select-none"
            style={{ fontFamily: 'serif' }}
          >
            アニメ
          </motion.div>

          {/* Main Title */}
          <motion.h1
            className="text-7xl md:text-9xl font-black text-center mb-6 relative"
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
            className="text-xl md:text-2xl text-gray-400 text-center mb-12 max-w-2xl"
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
            className="group relative px-12 py-5 text-xl font-bold text-white overflow-hidden rounded-full"
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
                className="w-6 h-6"
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
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer"
          onClick={() => setCurrentPage('home')}
        >
          アニメ<span className="text-white">HUB</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-8">
          {['Home', 'Search', 'Recommendations'].map((item) => (
            <motion.button
              key={item}
              whileHover={{ scale: 1.1, color: '#ec4899' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(item.toLowerCase())}
              className="text-gray-300 font-medium transition-colors"
            >
              {item}
            </motion.button>
          ))}
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold cursor-pointer">
            {favorites.length}
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </motion.nav>
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
            className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            <h3 className="text-xl font-bold text-white mb-1">{anime.title}</h3>
            <p className="text-pink-400 text-sm mb-2">{anime.jpTitle} • {anime.title}</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-yellow-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="text-sm font-bold">{anime.rating}</span>
              </div>
              <div className="flex gap-1">
                {anime.genre.slice(0, 2).map((g, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-purple-500/30 rounded-full text-purple-300">
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
            className="absolute top-3 right-3 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <motion.svg
              className={`w-6 h-6 ${isFavorite ? 'fill-pink-500' : 'fill-none'} stroke-pink-500`}
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
        <div className="mt-3">
          <h4 className="text-white font-bold truncate">{anime.title}</h4>
          <p className="text-gray-500 text-sm">{anime.jpTitle} • {anime.title}</p>
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
        className="min-h-screen bg-black pt-20"
      >
        <Navbar />

        {/* Hero Section */}
        <motion.section
          className="relative h-[80vh] overflow-hidden"
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

          <div className="relative z-10 h-full flex items-center px-4 md:px-20">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-pink-500 text-sm font-bold mb-4 tracking-widest"
              >
                今週の注目 • FEATURED THIS WEEK
              </motion.p>
              
              <motion.h2
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-6xl md:text-7xl font-black text-white mb-4"
              >
                {featuredAnime.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-3xl text-purple-400 mb-6 font-serif"
              >
                {featuredAnime.jpTitle} • {featuredAnime.title}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-gray-300 text-lg mb-8 max-w-xl"
              >
                {featuredAnime.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAnime(featuredAnime);
                    setCurrentPage('details');
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  見る • Watch Now
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-lg font-bold text-white border border-white/20"
                >
                  詳細 • More Info
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
        <section className="px-4 md:px-20 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-4xl font-black text-white mb-2">Trending Now</h3>
                <p className="text-pink-500 font-bold">トレンド中 • Most Popular</p>
              </div>
              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllTrending((prev) => !prev)}
                className="text-purple-400 font-bold flex items-center gap-2"
              >
                {showAllTrending ? 'Show Top 8' : 'View All'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {visibleTrending.map((anime, i) => (
                <AnimeCard key={anime.id} anime={anime} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Top Rated Section */}
        <section className="px-4 md:px-20 py-16 bg-gradient-to-b from-transparent to-purple-900/10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-4xl font-black text-white mb-2">Top Rated</h3>
                <p className="text-pink-500 font-bold">最高評価 • Highest Scores</p>
              </div>
              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllRated((prev) => !prev)}
                className="text-purple-400 font-bold flex items-center gap-2"
              >
                {showAllRated ? 'Show Top 8' : 'View All'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
        className="min-h-screen bg-black pt-20"
      >
        <Navbar />

        {/* Hero Section */}
        <div className="relative h-screen">
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

          <div className="relative z-10 h-full flex items-end px-4 md:px-20 pb-20">
            <div className="max-w-3xl">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -5 }}
                onClick={() => setCurrentPage('home')}
                className="text-gray-400 mb-6 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                戻る • Back
              </motion.button>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-6xl md:text-8xl font-black text-white mb-4"
              >
                {selectedAnime.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl text-purple-400 mb-6 font-serif"
              >
                {selectedAnime.jpTitle} • {selectedAnime.title}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 mb-6"
              >
                <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <svg className="w-6 h-6 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="text-xl font-bold text-yellow-400">{selectedAnime.rating}</span>
                </div>

                {selectedAnime.genre.map((g, i) => (
                  <span key={i} className="px-4 py-2 bg-purple-500/30 backdrop-blur-sm rounded-full text-purple-300 font-bold">
                    {g}
                  </span>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-300 text-xl mb-8 leading-relaxed"
              >
                {selectedAnime.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  再生 • Play Trailer
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFavorite(selectedAnime.id)}
                  className={`px-8 py-4 ${favorites.includes(selectedAnime.id) ? 'bg-pink-600' : 'bg-white/10'} backdrop-blur-sm rounded-lg font-bold text-white border border-white/20 flex items-center gap-2`}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  {favorites.includes(selectedAnime.id) ? '保存済み • Saved' : '保存 • Add to List'}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trailer Section */}
        <section className="px-4 md:px-20 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-black text-white mb-6">
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
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                  Trailer link unavailable for this title
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </motion.div>
    );
  };

  // SEARCH PAGE
  const SearchPage = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black pt-20"
    >
      <Navbar />

      <div className="px-4 md:px-20 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-black text-white mb-4">
            検索 • Search Anime
          </h1>

          {/* Search Bar */}
          <div className="relative mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or Japanese name..."
              className="w-full px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Genre Filter */}
          <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
            {genres.map((genre) => (
              <motion.button
                key={genre}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGenre(genre)}
                className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {genre}
              </motion.button>
            ))}
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {filteredAnime.length > 0 ? (
              filteredAnime.map((anime, i) => (
                <AnimeCard key={anime.id} anime={anime} delay={i * 0.05} />
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-500 text-xl">見つかりません • No results found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

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
        className="min-h-screen bg-black pt-20"
      >
        <Navbar />

        <div className="px-4 md:px-20 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-black text-white mb-4">
              おすすめ • Recommendations
            </h1>
            <p className="text-gray-400 text-xl mb-12">
              あなたの気分に合わせて • Choose your mood
            </p>

            {/* Mood Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {moods.map((mood, i) => (
                <motion.button
                  key={mood.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(mood)}
                  className={`p-8 rounded-2xl text-center transition-all ${
                    selectedMood?.name === mood.name
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-6xl mb-4">{mood.emoji}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{mood.name}</h3>
                  <p className="text-purple-300">{mood.jp}</p>
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
                  <h2 className="text-3xl font-black text-white mb-8">
                    Perfect for {selectedMood.name} mood
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
      <div className="min-h-screen bg-black flex items-center justify-center">
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
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
          />
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
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
        {currentPage === 'search' && <SearchPage key="search" />}
        {currentPage === 'recommendations' && <RecommendationsPage key="recommendations" />}
      </AnimatePresence>
    </div>
  );
};

export default AnimeWebsite;