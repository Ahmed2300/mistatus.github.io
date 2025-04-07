import React, { useEffect, useState } from 'react';
import { Activity, Moon, Sun, Coffee, Share2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

type Status = 'available' | 'busy' | 'away' | 'offline';

interface Profile {
  id: string;
  status: Status;
  custom_message?: string;
  updated_at: string;
}

export default function Dashboard() {
  const [status, setStatus] = useState<Status>('available');
  const [customMessage, setCustomMessage] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch profiles');
        return;
      }

      setProfiles(data || []);
    };

    fetchProfiles();

    const subscription = supabase
      .channel('profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateStatus = async (newStatus: Status) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        status: newStatus,
        custom_message: customMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    setStatus(newStatus);
    toast.success('Status updated!');
  };

  const handleShare = () => {
    if (!user) return;
    
    const url = `${window.location.origin}/profile/${user.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile URL copied to clipboard!');
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'available':
        return <Sun className="w-6 h-6 text-green-500" />;
      case 'busy':
        return <Activity className="w-6 h-6 text-red-500" />;
      case 'away':
        return <Coffee className="w-6 h-6 text-yellow-500" />;
      case 'offline':
        return <Moon className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Status Board</h1>
            <div className="flex gap-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share Profile
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Status Update Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Update Your Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <button
                onClick={() => updateStatus('available')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                  status === 'available' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Sun className="w-5 h-5" />
                Available
              </button>
              <button
                onClick={() => updateStatus('busy')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                  status === 'busy' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Activity className="w-5 h-5" />
                Busy
              </button>
              <button
                onClick={() => updateStatus('away')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                  status === 'away' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Coffee className="w-5 h-5" />
                Away
              </button>
              <button
                onClick={() => updateStatus('offline')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                  status === 'offline' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Moon className="w-5 h-5" />
                Offline
              </button>
            </div>
            <input
              type="text"
              placeholder="Add a custom message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Team Status Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Team Status</h2>
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                to={`/profile/${profile.id}`}
                className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(profile.status)}
                  <div>
                    <div className="font-semibold">
                      {profile.id === user?.id ? 'You' : `User ${profile.id}`}
                    </div>
                    {profile.custom_message && (
                      <div className="text-gray-400">{profile.custom_message}</div>
                    )}
                    <div className="text-sm text-gray-500">
                      Updated {new Date(profile.updated_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}