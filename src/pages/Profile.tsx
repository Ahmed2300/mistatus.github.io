import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Moon, Sun, Coffee, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type Status = 'available' | 'busy' | 'away' | 'offline';

interface Profile {
  id: string;
  status: Status;
  custom_message?: string;
  updated_at: string;
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      console.log('Profile ID:', id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Failed to fetch profile');
        return;
      }

      setProfile(data);
    };

    fetchProfile();

    const subscription = supabase
      .channel('profiles')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${id}`
      }, fetchProfile)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'available':
        return <Sun className="w-12 h-12 text-green-500" />;
      case 'busy':
        return <Activity className="w-12 h-12 text-red-500" />;
      case 'away':
        return <Coffee className="w-12 h-12 text-yellow-500" />;
      case 'offline':
        return <Moon className="w-12 h-12 text-gray-500" />;
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>

          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            <div className="flex items-center gap-6 mb-6">
              {getStatusIcon(profile.status)}
              <div>
                <h1 className="text-3xl font-bold mb-2">User Status</h1>
                <div className="text-xl font-semibold capitalize text-gray-300">
                  {profile.status}
                </div>
              </div>
            </div>

            {profile.custom_message && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Custom Message</h2>
                <p className="text-gray-300">{profile.custom_message}</p>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-400">
              Last updated: {new Date(profile.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
