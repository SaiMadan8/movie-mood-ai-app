import { useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

// Test movie database with better structure
const MOVIES = [
  // Happy Movies
  { id: '1', title: 'The Grand Budapest Hotel', genre: 'Comedy', moodTag: 'happy', rating: 8.1, year: 2014, description: 'A quirky, colorful adventure about friendship and fancy hotels.', poster: '🏨' },
  { id: '2', title: 'Paddington', genre: 'Family', moodTag: 'happy', rating: 8.2, year: 2014, description: 'A charming bear brings joy to everyone he meets in London.', poster: '🐻' },
  { id: '3', title: 'La La Land', genre: 'Musical', moodTag: 'happy', rating: 8.0, year: 2016, description: 'A magical musical about dreams, love, and following your heart.', poster: '🎭' },
  
  // Excited Movies
  { id: '4', title: 'Mad Max: Fury Road', genre: 'Action', moodTag: 'excited', rating: 8.1, year: 2015, description: 'Non-stop action in a post-apocalyptic wasteland chase.', poster: '🚗' },
  { id: '5', title: 'Inception', genre: 'Thriller', moodTag: 'excited', rating: 8.8, year: 2010, description: 'Mind-bending heist through layers of dreams.', poster: '🌀' },
  { id: '6', title: 'Spider-Man: Into the Spider-Verse', genre: 'Animation', moodTag: 'excited', rating: 8.4, year: 2018, description: 'Stunning animation meets superhero adventure.', poster: '🕷️' },
  
  // Relaxed Movies
  { id: '7', title: 'Before Sunset', genre: 'Romance', moodTag: 'relaxed', rating: 8.1, year: 2004, description: 'Two people reconnect while walking through Paris.', poster: '🌅' },
  { id: '8', title: 'Chef', genre: 'Drama', moodTag: 'relaxed', rating: 7.3, year: 2014, description: 'A chef rediscovers his passion through a food truck journey.', poster: '👨‍🍳' },
  { id: '9', title: 'The Princess Bride', genre: 'Adventure', moodTag: 'relaxed', rating: 8.1, year: 1987, description: 'A classic fairy tale with humor, adventure, and true love.', poster: '👸' },
  
  // Sad/Uplifting Movies
  { id: '10', title: 'Inside Out', genre: 'Animation', moodTag: 'sad', rating: 8.1, year: 2015, description: 'Understanding emotions through a young girl\'s mind.', poster: '🎨' },
  { id: '11', title: 'The Pursuit of Happyness', genre: 'Drama', moodTag: 'sad', rating: 8.0, year: 2006, description: 'A father\'s inspiring journey from struggle to success.', poster: '👨‍👦' },
  { id: '12', title: 'Good Will Hunting', genre: 'Drama', moodTag: 'sad', rating: 8.3, year: 1997, description: 'A brilliant young man discovers his true potential.', poster: '🧠' },
];

const MOOD_QUESTIONS = [
  {
    question: "How was your day today?",
    options: [
      { text: "Amazing! 😊", mood: "happy" },
      { text: "Good 😌", mood: "relaxed" },
      { text: "Okay 😐", mood: "relaxed" },
      { text: "Rough 😔", mood: "sad" }
    ]
  },
  {
    question: "What sounds appealing right now?",
    options: [
      { text: "Big adventure 🚀", mood: "excited" },
      { text: "Cozy night in 🏠", mood: "relaxed" },
      { text: "Something uplifting ☀️", mood: "happy" },
      { text: "Deep emotional story 💭", mood: "sad" }
    ]
  },
  {
    question: "Pick your ideal evening:",
    options: [
      { text: "Laughing with friends 😄", mood: "happy" },
      { text: "Quiet reflection 🤔", mood: "sad" },
      { text: "Heart-racing excitement ⚡", mood: "excited" },
      { text: "Peaceful relaxation 🧘", mood: "relaxed" }
    ]
  },
  {
    question: "Your energy level right now?",
    options: [
      { text: "Super high! 🔥", mood: "excited" },
      { text: "Content and calm 😊", mood: "relaxed" },
      { text: "Cheerful 😃", mood: "happy" },
      { text: "Low and thoughtful 💭", mood: "sad" }
    ]
  },
  {
    question: "What do you need most?",
    options: [
      { text: "Fun and laughter 😂", mood: "happy" },
      { text: "Adrenaline rush ⚡", mood: "excited" },
      { text: "Emotional release 😌", mood: "sad" },
      { text: "Peace and quiet 🕊️", mood: "relaxed" }
    ]
  }
];

function App() {
  const { user, signOut } = useAuthenticator();
  const [currentStep, setCurrentStep] = useState('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [moodAnswers, setMoodAnswers] = useState<string[]>([]);
  const [detectedMood, setDetectedMood] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [showSuccess, setShowSuccess] = useState('');

  const userName = user?.signInDetails?.loginId?.split('@')[0]?.split('.')[0] || 'Friend';

  const calculateMood = (answers: string[]) => {
    const moodCount = answers.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(moodCount).reduce((a, b) => 
      moodCount[a[0]] > moodCount[b[0]] ? a : b
    )[0];
  };

  const getRecommendations = (mood: string) => {
    return MOVIES.filter(movie => movie.moodTag === mood);
  };

  const handleAnswerSelect = (mood: string) => {
    const newAnswers = [...moodAnswers, mood];
    setMoodAnswers(newAnswers);

    if (currentQuestion < MOOD_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const finalMood = calculateMood(newAnswers);
      setDetectedMood(finalMood);
      setRecommendations(getRecommendations(finalMood));
      
      client.models.MoodAssessment.create({ mood: finalMood });
      
      setCurrentStep('movies');
      setCurrentPage('home');
    }
  };

  const handleWatchMovie = async (movie: any) => {
    const newWatchlist = [...watchlist, movie];
    setWatchlist(newWatchlist);
    
    await client.models.UserMovie.create({
      movieId: movie.id,
      movieTitle: movie.title,
      userRating: 0,
      watched: true,
    });
    
    setShowSuccess(`✨ Added "${movie.title}" to your watchlist!`);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const restartAssessment = () => {
    setCurrentStep('welcome');
    setCurrentQuestion(0);
    setMoodAnswers([]);
    setDetectedMood('');
    setRecommendations([]);
  };

  const getMoodEmoji = (mood: string) => {
    const emojis = { happy: '😊', excited: '🚀', relaxed: '😌', sad: '🤗' };
    return emojis[mood as keyof typeof emojis] || '🎬';
  };

  const getMoodColor = (mood: string) => {
    const colors = { 
      happy: '#f59e0b', 
      excited: '#ef4444', 
      relaxed: '#06b6d4', 
      sad: '#8b5cf6' 
    };
    return colors[mood as keyof typeof colors] || '#6366f1';
  };

  const NavigationHeader = () => (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: 'white',
      boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            🎬 YOURS CINEMA
          </h1>
          <nav style={{ display: 'flex', gap: '24px' }}>
            {['home', 'watchlist', 'profile'].map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentPage(tab)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === tab ? getMoodColor(detectedMood) : 'transparent',
                  color: currentPage === tab ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'home' ? '🏠 Home' : tab === 'watchlist' ? '📝 Watchlist' : '👤 Profile'}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
            Hi, {userName}!
          </span>
          <button 
            onClick={signOut}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f3f4f6', 
              color: '#374151', 
              border: 'none', 
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );

  const SuccessMessage = () => showSuccess ? (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '24px',
      backgroundColor: '#10b981',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      zIndex: 1001,
      fontSize: '14px',
      fontWeight: '600',
      animation: 'slideIn 0.3s ease'
    }}>
      {showSuccess}
    </div>
  ) : null;

  if (currentStep === 'welcome') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '40px' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
            🎬 YOURS CINEMA
          </h1>
          <h2 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: '600', opacity: '0.9' }}>
            Welcome back, {userName}!
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '48px', lineHeight: '1.6', opacity: '0.8' }}>
            Ready to discover movies that perfectly match your mood? 
            Let's find your next favorite film based on how you're feeling right now.
          </p>
          
          <button 
            onClick={() => setCurrentStep('questions')}
            style={{
              fontSize: '18px',
              fontWeight: '600',
              padding: '16px 48px',
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            Start Mood Assessment ✨
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'questions') {
    const progress = ((currentQuestion + 1) / MOOD_QUESTIONS.length) * 100;
    
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: '12px', 
              height: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                backgroundColor: 'white', 
                height: '100%', 
                borderRadius: '12px',
                width: `${progress}%`,
                transition: 'width 0.5s ease'
              }}></div>
            </div>
            <p style={{ textAlign: 'center', opacity: '0.8', fontSize: '16px', fontWeight: '500' }}>
              Question {currentQuestion + 1} of {MOOD_QUESTIONS.length}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '48px', fontWeight: '700', lineHeight: '1.2' }}>
              {MOOD_QUESTIONS[currentQuestion].question}
            </h2>
            
            <div style={{ display: 'grid', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
              {MOOD_QUESTIONS[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option.mood)}
                  style={{
                    padding: '20px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavigationHeader />
      <SuccessMessage />
      
      <main style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        <div className="container">
          {currentPage === 'home' && (
            <>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '48px',
                padding: '48px 32px',
                background: `linear-gradient(135deg, ${getMoodColor(detectedMood)}20, ${getMoodColor(detectedMood)}10)`,
                borderRadius: '20px',
                border: `2px solid ${getMoodColor(detectedMood)}30`
              }}>
                <h1 style={{ 
                  fontSize: '3rem', 
                  marginBottom: '16px',
                  fontWeight: '800',
                  color: getMoodColor(detectedMood)
                }}>
                  {getMoodEmoji(detectedMood)} You're feeling {detectedMood}!
                </h1>
                <p style={{ fontSize: '18px', color: '#6b7280', fontWeight: '500' }}>
                  Here are movies perfect for your current mood
                </p>
                <button
                  onClick={restartAssessment}
                  style={{ 
                    marginTop: '24px',
                    padding: '12px 24px', 
                    backgroundColor: getMoodColor(detectedMood), 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  🔄 Retake Assessment
                </button>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                {recommendations.map((movie) => (
                  <div key={movie.id} style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      padding: '24px',
                      background: `linear-gradient(135deg, ${getMoodColor(detectedMood)}15, ${getMoodColor(detectedMood)}05)`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {movie.poster}
                      </div>
                      <h3 style={{ 
                        fontSize: '20px', 
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '8px'
                      }}>
                        {movie.title}
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '16px',
                        marginBottom: '16px'
                      }}>
                        <span style={{ 
                          color: getMoodColor(detectedMood), 
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {movie.genre}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>
                          ⭐ {movie.rating}/10
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>
                          {movie.year}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ padding: '24px' }}>
                      <p style={{ 
                        color: '#6b7280', 
                        lineHeight: '1.6',
                        marginBottom: '24px',
                        fontSize: '14px'
                      }}>
                        {movie.description}
                      </p>
                      <button
                        onClick={() => handleWatchMovie(movie)}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: getMoodColor(detectedMood),
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        ➕ Add to Watchlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {currentPage === 'watchlist' && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#374151' }}>
                📝 Your Watchlist
              </h2>
              {watchlist.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '18px' }}>
                  No movies in your watchlist yet. Add some from your recommendations!
                </p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginTop: '40px'
                }}>
                  {watchlist.map((movie) => (
                    <div key={movie.id} style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{movie.poster}</div>
                      <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>{movie.title}</h3>
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>{movie.genre} • {movie.year}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentPage === 'profile' && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#374151' }}>
                👤 Profile
              </h2>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '40px', 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>
                  {getMoodEmoji(detectedMood)}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                  {userName}
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                  Current mood: <span style={{ color: getMoodColor(detectedMood), fontWeight: '600' }}>{detectedMood}</span>
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Movies in watchlist: {watchlist.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
