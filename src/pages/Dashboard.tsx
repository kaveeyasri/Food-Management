import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { FoodListing } from '../types';
import FoodCard from '../components/FoodCard';
import MapView from '../components/MapView';
import ClaimModal from '../components/ClaimModal';
import { useAuth } from '../context/AuthContext';
import { LayoutList, Map, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'list' | 'map';
type FilterStatus = 'available' | 'all';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('available');
  const [filterType, setFilterType] = useState('All');
  const [claimTarget, setClaimTarget] = useState<FoodListing | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [liveCount, setLiveCount] = useState(0);

  const fetchListings = useCallback(async () => {
    let query = supabase
      .from('listings')
      .select('*, profiles(full_name, role, phone)')
      .order('expires_at', { ascending: true });

    if (filterStatus === 'available') {
      query = query.eq('status', 'available');
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load listings');
      return;
    }
    setListings((data as FoodListing[]) || []);
    setLiveCount((data as FoodListing[])?.filter(l => l.status === 'available').length || 0);
    setLoading(false);
  }, [filterStatus]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          if (err.code === 1) {
            console.warn('Location permission denied');
          } else {
            console.error('Geolocation error:', err.message);
          }
        }
      );
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchListings();
  }, [fetchListings]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('listings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchListings]);

  const filtered = listings.filter(l => {
    const matchSearch = l.food_item.toLowerCase().includes(search.toLowerCase()) ||
      (l.address || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || l.food_type === filterType;
    return matchSearch && matchType;
  });

  const handleClaimSuccess = () => {
    setClaimTarget(null);
    fetchListings();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Food Dashboard</h1>
          <p className="dashboard-sub">
            <span className="live-dot" /> {liveCount} listing{liveCount !== 1 ? 's' : ''} available now
          </p>
        </div>
        <button className="btn-ghost refresh-btn" onClick={fetchListings} title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="dashboard-filters">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="filter-search"
            placeholder="Search food, location, donor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <SlidersHorizontal size={16} />
          {['All', 'Veg', 'Non-Veg', 'Vegan', 'Mixed'].map(t => (
            <button
              key={t}
              className={`filter-chip ${filterType === t ? 'active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <button
            className={`filter-chip ${filterStatus === 'available' ? 'active' : ''}`}
            onClick={() => setFilterStatus('available')}
          >
            Available Only
          </button>
          <button
            className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
        </div>
      </div>

      {/* Urgency Legend */}
      <div className="urgency-legend">
        <span className="legend-item"><span className="legend-dot urgent" /> &lt; 30 min</span>
        <span className="legend-item"><span className="legend-dot moderate" /> 30min–5hr</span>
        <span className="legend-item"><span className="legend-dot fresh" /> &gt; 5 hrs</span>
      </div>

      {/* Tab Switch */}
      <div className="tab-switch">
        <button className={`tab-btn ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          <LayoutList size={16} /> List View
        </button>
        <button className={`tab-btn ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>
          <Map size={16} /> Map View
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner" />
          <p>Loading listings...</p>
        </div>
      ) : tab === 'list' ? (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <h3>No listings found</h3>
            <p>Try adjusting your filters or check back soon.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filtered.map(listing => (
              <FoodCard
                key={listing.id}
                listing={listing}
                onClaim={setClaimTarget}
                isOwner={listing.donor_id === user?.id}
              />
            ))}
          </div>
        )
      ) : (
        <MapView
          listings={filtered}
          onClaim={setClaimTarget}
          userLocation={userLocation}
          currentUserId={user?.id}
        />
      )}

      {claimTarget && (
        <ClaimModal
          listing={claimTarget}
          onClose={() => setClaimTarget(null)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
