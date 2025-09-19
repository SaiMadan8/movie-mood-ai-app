import { useEffect, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

// Test movie database
const MOVIES = [
  // Happy Movies
  { id: '1', title: 'The Grand Budapest Hotel', genre: 'Comedy', moodTag: 'happy', rating: 8.1, description: 'A quirky, colorful adventure about friendship and fancy hotels.' },
  { id: '2', title: 'Paddington', genre: 'Family', moodTag: 'happy', rating: 8.2, description: 'A charming bear brings joy to everyone he meets in London.' },
  { id: '3', title: 'La La Land', genre: 'Musical', moodTag: 'happy', rating: 8.0, description: 'A magical musical about dreams, love, and following your heart.' },
  
  // Excited Movies
  { id: '4', title: 'Mad Max: Fury Road', genre: 'Action', moodTag: 'excited', rating: 8.1, description: 'Non-stop action in a post-apocalyptic wasteland chase.' },
  { id: '5', title: 'Inception', genre: 'Thriller', moodTag: 'excited', rating: 8.8, description: 'Mind-bending heist through layers of dreams.' },
  { id: '6', title: 'Spider-Man: Into the Spider-Verse', genre: 'Animation', moodTag: 'excited', rating: 8.4, description: 'Stunning animation meets superhero adventure.' },
  
  // Relaxed Movies
  { id: '7', title: 'Before Sunset', genre: 'Romance', moodTag: 'relaxed', rating: 8.1, description: 'Two people reconnect while walking through Paris.' },
  { id: '8', title: 'Chef', genre: 'Drama', moodTag: 'relaxed', rating: 7.3, description: 'A chef rediscovers his passion through a food truck journey.' },
  { id: '9', title: 'The Princess Bride', genre: 'Adventure', moodTag: 'relaxed', rating: 8.1, description: 'A classic fairy tale with humor, adventure, and true love.' },
  
  // Sad/Uplifting Movies
  { id: '10', title: 'Inside Out', genre: 'Animation', moodTag: 'sad', rating: 8.1, description: 'Understanding emotions through a young girl\'s mind.' },
  { id: '11', title: 'The Pursuit of Happyness', genre: 'Drama', moodTag: 'sad', rating: 8.0, description: 'A father\'s inspiring journey from struggle to success.' },
  { id: '12', title: 'Good Will Hunting', genre: 'Drama', moodTag: 'sad', rating: 8.3, description: 'A brilliant young man discovers his true potential.' },
];

const MOOD_QUESTIONS = [
  {
    question: "How was your day today?",
    options: [
      { text: "Amazing!", mood: "happy" },
      { text: "Good", mood: "relaxed" },
      { text: "Okay", mood: "relaxed" },
      { text: "Rough", mood: "sad" }
    ]
  },
  {
    question: "What sounds appealing right now?",
    options: [
      { text: "Big adventure", mood: "excited" },
      { text: "Cozy night in", mood: "relaxed" },
      { text: "Something uplifting", mood: "happy" },
      { text: "Deep emotional story", mood: "sad" }
    ]
  },
  {
    question: "Pick your ideal evening:",
    options: [
      { text: "Laughing with friends", mood: "happy" },
      { text: "Quiet reflection", mood: "sad" },
      { text: "Heart-racing excitement", mood: "excited" },
      { text: "Peaceful relaxation", mood: "relaxed" }
    ]
  },
  {
    question: "Your energy level right now?",
    options: [
      { text: "Super high!", mood: "excited" },
      { text: "Content and calm", mood: "relaxed" },
      { text: "Cheerful", mood: "happy" },
      { text: "Low and thoughtful", mood: "sad" }
    ]
  },
  {
    question: "What do you need most?",
    options: [
      { text: "Fun and laughter", mood: "happy" },
      { text: "Adrenaline rush", mood: "excited" },
      { text: "Emotional release", mood: "sad" },
      { text: "Peace and quiet", mood: "relaxed" }
    ]
  }
];

function App() {
  const { user, signOut } = useAuthenticator();
  const [currentStep, setCurrentStep] = useState('welcome'); // 'welcome', 'questions', 'movies'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [moodAnswers, setMoodAnswers] = useState<string[]>([]);
  const [detectedMood, setDetectedMood] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const userName = user?.signInDetails?.loginId?.split('@')[0] || 'Movie Lover';

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
    return MOVIES.filter(movie => movie.moodTag === mood).slice(0, 3);
  };

  const handleAnswerSelect = (mood: string) => {
    const newAnswers = [...moodAnswers, mood];
    setMoodAnswers(newAnswers);

    if (currentQuestion < MOOD_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered
      const finalMood = calculateMood(newAnswers);
      setDetectedMood(finalMood);
      setRecommendations(getRecommendations(finalMood));
      
      // Save mood assessment
      client.models.MoodAssessment.create({
        mood: finalMood,
      });
      
      setCurrentStep('movies');
    }
  };

  const handleWatchMovie = async (movie: any) => {
    await client.models.UserMovie.create({
      movieId: movie.id,
      movieTitle: movie.title,
      userRating: 0,
      watched: true,
    });
    alert(`Added "${movie.title}" to your watched list!`);
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
      happy: '#FFD700', 
      excited: '#FF4500', 
      relaxed: '#87CEEB', 
      sad: '#9370DB' 
    };
    return colors[mood as keyof typeof colors] || '#6B46C1';
  };

  if (currentStep === 'welcome') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button 
            onClick={signOut}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px', 
              cursor: 'pointer' 
            }}
          >
            Sign out
          </button>
        </div>

        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '40px' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            🎬 YOURS CINEMA
          </h1>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '30px', opacity: '0.9' }}>
            Welcome back, {userName}!
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', lineHeight: '1.6' }}>
            Ready to discover movies that perfectly match your mood? 
            Let's find your next favorite film based on how you're feeling right now.
          </p>
          
          <button 
            onClick={() => setCurrentStep('questions')}
            style={{
              fontSize: '1.2rem',
              padding: '15px 40px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#667eea',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
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
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: '10px', 
              height: '8px',
              marginBottom: '10px'
            }}>
              <div style={{ 
                backgroundColor: 'white', 
                height: '100%', 
                borderRadius: '10px',
                width: `${progress}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <p style={{ textAlign: 'center', opacity: '0.8' }}>
              Question {currentQuestion + 1} of {MOOD_QUESTIONS.length}
            </p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>
              {MOOD_QUESTIONS[currentQuestion].question}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {MOOD_QUESTIONS[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option.mood)}
                  style={{
                    padding: '15px 30px',
                    fontSize: '1.1rem',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
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

  if (currentStep === 'movies') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: `linear-gradient(135deg, ${getMoodColor(detectedMood)}22 0%, ${getMoodColor(detectedMood)}44 100%)`,
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ margin: '0', color: '#333' }}>🎬 YOURS CINEMA</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Hello, {userName}!</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={restartAssessment} style={{ 
              padding: '10px 20px', 
              backgroundColor: getMoodColor(detectedMood), 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px', 
              cursor: 'pointer' 
            }}>
              New Assessment
            </button>
            <button onClick={signOut} style={{ 
              padding: '10px 20px', 
              backgroundColor: '#666', 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px', 
              cursor: 'pointer' 
            }}>
              Sign out
            </button>
          </div>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '15px',
            color: getMoodColor(detectedMood)
          }}>
            {getMoodEmoji(detectedMood)} You're feeling {detectedMood}!
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            Here are movies perfect for your current mood:
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {recommendations.map((movie) => (
            <div key={movie.id} style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                marginBottom: '10px',
                color: '#333'
              }}>
                🎬 {movie.title}
              </h3>
              <p style={{ 
                color: getMoodColor(detectedMood), 
                fontWeight: 'bold',
                marginBottom: '10px'
              }}>
                {movie.genre} • ⭐ {movie.rating}/10
              </p>
              <p style={{ 
                color: '#666', 
                lineHeight: '1.5',
                marginBottom: '20px'
              }}>
                {movie.description}
              </p>
              <button
                onClick={() => handleWatchMovie(movie)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: getMoodColor(detectedMood),
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Add to Watched List
              </button>
            </div>
          ))}
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px',
          color: '#666'
        }}>
          <p>
            ✨ YOURS CINEMA - Movies that match your mood ✨
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
