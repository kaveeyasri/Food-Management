import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { FoodListing, Transaction } from '../types';
import { User, Package, Heart, Edit3, Save, X, Phone, MapPin, TrendingUp, CheckCircle2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ROLES = ['Individual', 'NGO', 'Restaurant', 'Hotel', 'Canteen'];

type ActiveTab = 'overview' | 'donations' | 'claims';

const Nexus: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<ActiveTab>('overview');
  const [editing, setEditing] = useState(false);
  const [myListings, setMyListings] = useState<FoodListing[]>([]);
  const [myClaims, setMyClaims] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditRole(profile.role || 'Individual');
      setEditPhone(profile.phone || '');
      setEditAddress(profile.address || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);

    const fetchAll = async () => {
      const [listingsRes, claimsRes] = await Promise.all([
        supabase.from('listings').select('*, transactions(receiver_id, profiles:profiles(full_name, phone, role))').eq('donor_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*, listings(food_item, quantity, unit, expires_at, address)').eq('receiver_id', user.id).order('claimed_at', { ascending: false }),
      ]);
      if (listingsRes.data) setMyListings(listingsRes.data as any[]);
      if (claimsRes.data) setMyClaims(claimsRes.data as Transaction[]);
      setLoadingData(false);
    };

    fetchAll();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editName,
      role: editRole,
      phone: editPhone,
      address: editAddress,
    }).eq('id', user.id);

    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile updated!');
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const handleUpdateListingStatus = async (id: string, newStatus: string) => {
    try {
      if (newStatus === 'cancelled') {
        const { error } = await supabase.from('listings').delete().eq('id', id);
        if (error) throw error;
        toast.success('Listing removed');
        setMyListings(prev => prev.filter(l => l.id !== id));
      } else {
        // 1. Update the listing
        const { error: listingError } = await supabase
          .from('listings')
          .update({ status: newStatus })
          .eq('id', id);
          
        if (listingError) throw listingError;

        // 2. If marking collected, also confirm the transaction so the receiver sees it
        if (newStatus === 'collected') {
          await supabase
            .from('transactions')
            .update({ status: 'confirmed' })
            .eq('listing_id', id)
            .eq('status', 'pending');
        }

        toast.success('Marked as collected!');
        setMyListings(prev => prev.map(l => 
          l.id === id ? { ...l, status: newStatus as any } : l
        ));
      }
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const totalDonated = myListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
  const collectedCount = myListings.filter(l => l.status === 'collected').length;
  const claimsCount = myClaims.length;

  const statusColors: Record<string, string> = {
    available: '#3D9970',
    pending: '#F2CC8F',
    collected: '#2D6A4F',
    confirmed: '#3D9970',
    cancelled: '#E07A5F',
  };

  return (
    <div className="nexus-page">
      {/* Profile Header */}
      <div className="nexus-header">
        <div className="nexus-avatar">
          <span>{profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</span>
        </div>
        <div className="nexus-user-info">
          {editing ? (
            <div className="edit-name-row">
              <input className="form-input inline-name-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" />
            </div>
          ) : (
            <h1>{profile?.full_name || 'Anonymous User'}</h1>
          )}
          <p className="nexus-email">{user?.email}</p>
          <span className="nexus-role-badge">{profile?.role || 'Individual'}</span>
        </div>
        <div className="nexus-edit-btns">
          {editing ? (
            <>
              <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>
                <X size={16} />
              </button>
            </>
          ) : (
            <button className="btn-outline edit-profile-btn" onClick={() => setEditing(true)}>
              <Edit3 size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="profile-edit-form glass-card">
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Role</label>
              <div className="role-grid mini">
                {ROLES.map(r => (
                  <button key={r} type="button" className={`role-chip ${editRole === r ? 'active' : ''}`} onClick={() => setEditRole(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label><Phone size={14} /> Phone</label>
              <input className="form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 9999999999" />
            </div>
            <div className="form-group flex-2">
              <label><MapPin size={14} /> Address</label>
              <input className="form-input" value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="City, State" />
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="nexus-stats">
        <div className="nexus-stat-card">
          <TrendingUp size={22} />
          <span className="stat-val">{myListings.length}</span>
          <span className="stat-lbl">Total Donations</span>
        </div>
        <div className="nexus-stat-card">
          <Package size={22} />
          <span className="stat-val">{totalDonated.toFixed(1)} kg</span>
          <span className="stat-lbl">Food Donated</span>
        </div>
        <div className="nexus-stat-card">
          <Heart size={22} />
          <span className="stat-val">{claimsCount}</span>
          <span className="stat-lbl">Claims Made</span>
        </div>
        <div className="nexus-stat-card highlight">
          <span className="stat-val">{collectedCount}</span>
          <span className="stat-lbl">Meals Delivered</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="nexus-tabs">
        {(['overview', 'donations', 'claims'] as ActiveTab[]).map(t => (
          <button key={t} className={`nexus-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? <User size={15} /> : t === 'donations' ? <Package size={15} /> : <Heart size={15} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loadingData ? (
        <div className="nexus-loading"><div className="spinner" /></div>
      ) : tab === 'overview' ? (
        <div className="nexus-overview">
          <div className="glass-card overview-info">
            <h3>Profile Information</h3>
            <div className="info-row"><User size={16} /><span>{profile?.full_name || '—'}</span></div>
            <div className="info-row"><Phone size={16} /><span>{profile?.phone || '—'}</span></div>
            <div className="info-row"><MapPin size={16} /><span>{profile?.address || '—'}</span></div>
          </div>
          <div className="glass-card overview-recent">
            <h3>Recent Activity</h3>
            {myListings.slice(0, 3).map(l => (
              <div key={l.id} className="activity-row">
                <span className="activity-icon">📦</span>
                <div>
                  <strong>{l.food_item}</strong>
                  <p>{l.quantity} {l.unit} · {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
                </div>
                <span className="status-badge" style={{ backgroundColor: statusColors[l.status] }}>{l.status}</span>
              </div>
            ))}
            {myListings.length === 0 && <p className="empty-hint">No activity yet. Start donating! 🌱</p>}
          </div>
        </div>
      ) : tab === 'donations' ? (
        <div className="nexus-list">
          {myListings.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📦</div><h3>No donations yet</h3><p>Head to <a href="/donate">Donate Food</a> to start making a difference.</p></div>
          ) : myListings.map(l => (
            <div key={l.id} className="nexus-row glass-card">
              <div className="nexus-row-main">
                <strong>{l.food_item}</strong>
                <p>{l.quantity} {l.unit} · <span className="food-type-mini">{l.food_type}</span></p>
                {l.address && <p className="nexus-address"><MapPin size={12} /> {l.address}</p>}
                
                {/* Receiver Info for Donor */}
                {l.status !== 'available' && (l as any).transactions?.[0]?.profiles && (
                  <div className="receiver-card">
                    <User size={12} />
                    <span className="receiver-name">Claimed by: {(l as any).transactions[0].profiles.full_name || 'Anonymous'}</span>
                    <div className="receiver-contact">
                      <Phone size={11} />
                      <span>{(l as any).transactions[0].profiles.phone || 'No phone'}</span>
                    </div>
                  </div>
                )}

                <p className="nexus-time">Posted {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
              </div>
              <div className="nexus-row-actions">
                <span className="status-badge" style={{ backgroundColor: statusColors[l.status] }}>{l.status}</span>
                {l.status === 'pending' && (
                  <button 
                    className="action-btn success" 
                    onClick={() => handleUpdateListingStatus(l.id, 'collected')}
                    title="Mark as collected by receiver"
                  >
                    <CheckCircle2 size={16} /> Collected
                  </button>
                )}
                {l.status === 'available' && (
                  <button 
                    className="action-btn danger" 
                    onClick={() => handleUpdateListingStatus(l.id, 'cancelled')}
                    title="Cancel this listing"
                  >
                    <Ban size={16} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nexus-list">
          {myClaims.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🤲</div><h3>No claims yet</h3><p>Browse the <a href="/dashboard">Dashboard</a> to claim available food.</p></div>
          ) : myClaims.map(tx => (
            <div key={tx.id} className="nexus-row glass-card">
              <div className="nexus-row-main">
                <strong>{(tx.listings as any)?.food_item || 'Food Item'}</strong>
                <p>{(tx.listings as any)?.quantity} {(tx.listings as any)?.unit}</p>
                {(tx.listings as any)?.address && <p className="nexus-address"><MapPin size={12} /> {(tx.listings as any).address}</p>}
                <p className="nexus-time">Claimed {formatDistanceToNow(new Date(tx.claimed_at), { addSuffix: true })}</p>
              </div>
              <span className="status-badge" style={{ backgroundColor: statusColors[tx.status] }}>{tx.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Nexus;
