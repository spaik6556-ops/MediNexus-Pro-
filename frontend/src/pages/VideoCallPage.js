import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Settings, Maximize2, Minimize2, Clock, User
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VideoCallPage = () => {
  const { appointmentId, channelName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState('connecting');
  const [remoteUser, setRemoteUser] = useState(null);
  const [agoraData, setAgoraData] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });

  // Format duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Initialize Agora
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get token from backend
        const tokenResponse = await axios.post(`${API_URL}/v1/video/token`, {
          channel: channelName,
          appointment_id: appointmentId
        });
        
        setAgoraData(tokenResponse.data);
        
        // Dynamic import Agora SDK
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        
        // Create client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;
        
        // Event handlers
        client.on('user-joined', (user) => {
          console.log('Remote user joined:', user.uid);
          setRemoteUser(user);
        });
        
        client.on('user-left', (user) => {
          console.log('Remote user left:', user.uid);
          setRemoteUser(null);
        });
        
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });
        
        client.on('user-unpublished', async (user, mediaType) => {
          await client.unsubscribe(user, mediaType);
        });
        
        client.on('connection-state-change', (curState) => {
          setConnectionState(curState);
        });
        
        // Create local tracks
        const [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack()
        ]);
        
        localTracksRef.current = { audio: audioTrack, video: videoTrack };
        
        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        
        // Join channel
        await client.join(
          tokenResponse.data.app_id,
          channelName,
          tokenResponse.data.token,
          tokenResponse.data.uid
        );
        
        // Publish tracks
        await client.publish([audioTrack, videoTrack]);
        
        setIsJoined(true);
        setConnectionState('connected');
        toast.success('Подключение установлено');
        
      } catch (error) {
        console.error('Agora init error:', error);
        setConnectionState('failed');
        toast.error('Ошибка подключения к видеозвонку');
      }
    };
    
    initializeCall();
    
    // Cleanup
    return () => {
      const cleanup = async () => {
        if (localTracksRef.current.audio) {
          localTracksRef.current.audio.close();
        }
        if (localTracksRef.current.video) {
          localTracksRef.current.video.close();
        }
        if (clientRef.current) {
          await clientRef.current.leave();
        }
      };
      cleanup();
    };
  }, [channelName, appointmentId]);

  // Call duration timer
  useEffect(() => {
    if (!isJoined) return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isJoined]);

  // Toggle microphone
  const toggleMic = async () => {
    if (localTracksRef.current.audio) {
      await localTracksRef.current.audio.setMuted(isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    if (localTracksRef.current.video) {
      await localTracksRef.current.video.setEnabled(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  // End call
  const endCall = async () => {
    try {
      // Record call end
      await axios.post(`${API_URL}/v1/video/end/${appointmentId}`, null, {
        params: { duration_minutes: Math.ceil(callDuration / 60) }
      });
      
      // Cleanup
      if (localTracksRef.current.audio) {
        localTracksRef.current.audio.close();
      }
      if (localTracksRef.current.video) {
        localTracksRef.current.video.close();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      
      toast.success('Консультация завершена');
      navigate('/appointments');
    } catch (error) {
      console.error('End call error:', error);
      navigate('/appointments');
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col" data-testid="video-call-page">
      {/* Header */}
      <header className="bg-stone-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Видеоконсультация</h1>
            <p className="text-sm text-stone-400">
              {connectionState === 'connected' ? 'Подключено' : 
               connectionState === 'connecting' ? 'Подключение...' : 
               connectionState === 'failed' ? 'Ошибка подключения' : connectionState}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-stone-700 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="font-mono text-white">{formatDuration(callDuration)}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-stone-700"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Video Container */}
      <main className="flex-1 p-6 flex gap-6">
        {/* Remote Video (Large) */}
        <div className="flex-1 bg-stone-800 rounded-2xl overflow-hidden relative">
          <div 
            ref={remoteVideoRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
          {!remoteUser && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-stone-700 flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-stone-500" />
                </div>
                <p className="text-xl text-stone-400">Ожидание участника...</p>
                <p className="text-sm text-stone-500 mt-2">
                  Второй участник скоро подключится
                </p>
              </div>
            </div>
          )}
          {remoteUser && (
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
              <span className="text-white text-sm">
                {user?.role === 'patient' ? 'Врач' : 'Пациент'}
              </span>
            </div>
          )}
        </div>

        {/* Local Video (Small) */}
        <div className="w-80 flex flex-col gap-4">
          <div className="bg-stone-800 rounded-2xl overflow-hidden relative aspect-video">
            <div 
              ref={localVideoRef}
              className="w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded">
              <span className="text-white text-xs">Вы ({user?.full_name?.split(' ')[0]})</span>
            </div>
          </div>

          {/* Call Info */}
          <div className="bg-stone-800 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-stone-400 mb-3">Информация</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Канал:</span>
                <span className="text-white font-mono text-xs">{channelName?.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Качество:</span>
                <span className="text-green-400">Хорошее</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Участники:</span>
                <span className="text-white">{remoteUser ? 2 : 1}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Control Bar */}
      <footer className="bg-stone-800/80 backdrop-blur-md px-6 py-6">
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMicOn ? 'bg-stone-700 hover:bg-stone-600' : 'bg-red-500 hover:bg-red-600'
            }`}
            data-testid="toggle-mic-btn"
          >
            {isMicOn ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isCameraOn ? 'bg-stone-700 hover:bg-stone-600' : 'bg-red-500 hover:bg-red-600'
            }`}
            data-testid="toggle-camera-btn"
          >
            {isCameraOn ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
            data-testid="end-call-btn"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
          >
            <Settings className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </footer>
    </div>
  );
};

export default VideoCallPage;
