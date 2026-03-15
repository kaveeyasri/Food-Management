import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { MapPin, Package, Clock, Leaf, ChevronLeft, Camera, Navigation, Upload, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

const FOOD_TYPES = ['Veg', 'Non-Veg', 'Vegan', 'Mixed'];
const UNITS = ['kg', 'ltr', 'portions', 'packs', 'pieces'];

// Custom Map Marker Icon
const mapPinIcon = L.divIcon({
  html: `<div style="
    background-color: #E07A5F; 
    width: 38px; 
    height: 38px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    border-radius: 50%; 
    border: 3px solid white; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.25); 
    color: white;
  "><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  className: 'custom-map-icon',
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});

// Draggable Marker Component for Address Selection
function LocationPickerMarker({ position, setPosition, setAddress }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void, setAddress: (addr: string) => void }) {
  const markerRef = useRef<L.Marker>(null);

  // Allow clicking on map to move pin
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng, setAddress);
    },
  });

  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          reverseGeocode(newPos.lat, newPos.lng, setAddress);
        }
      },
    }),
    [setPosition, setAddress],
  );

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={mapPinIcon}
    />
  );
}

// Component to handle auto-panning the map when position state changes externally
function MapPanController({ position }: { position: L.LatLng | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (position) {
      // Use zoom level 16 for street view
      map.setView(position, 16, {
        animate: true,
        duration: 1
      });
    }
  }, [position, map]);
  return null;
}

// Helper to reverse geocode lat/lng to text
const reverseGeocode = async (lat: number, lng: number, setAddress: (addr: string) => void) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    if (data && data.display_name) {
      setAddress(data.display_name);
    }
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
  }
};

const Donate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [foodItem, setFoodItem] = useState('');
  const [foodType, setFoodType] = useState('Veg');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New state to manage the interactive map pin position
  const [mapPosition, setMapPosition] = useState<L.LatLng | null>(null);

  // Sync point between map position and actual coordinates
  const handleMapPositionChange = (pos: L.LatLng) => {
    setMapPosition(pos);
    setLat(pos.lat);
    setLng(pos.lng);
  };

  // Sync map to manual address typing (debounced)
  useEffect(() => {
    if (!address.trim() || gettingLocation) return;
    
    const delayDebounceFn = setTimeout(async () => {
      // Avoid circular updates if address was just set by clicking the map
      if (lat && lng) return; 

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}&limit=1&countrycodes=in`);
        const data = await res.json();
        if (data && data.length > 0) {
          const newLat = parseFloat(data[0].lat);
          const newLng = parseFloat(data[0].lon);
          setLat(newLat);
          setLng(newLng);
          setMapPosition(new L.LatLng(newLat, newLng));
        }
      } catch (err) {
        console.error("Geocoding from input failed:", err);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [address]);

  // Default to current location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setMapPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }

        setGettingLocation(false);
        toast.success('Location captured!');
      },
      () => {
        toast.error('Could not get location. Please enter address manually.');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!expiresAt) {
      toast.error('Please set the expiry time');
      return;
    }

    if (new Date(expiresAt) <= new Date()) {
      toast.error('Expiry time must be in the future');
      return;
    }

    setLoading(true);
    let finalLat = lat;
    let finalLng = lng;
    let finalImageUrl = imageUrl;

    try {
      // 0. Upload image if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `food-photos/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('listings')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error("Upload error details:", uploadError);
          throw new Error('Failed to upload image. Make sure "listings" bucket exists and is public.');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      // 1. If address is provided but no lat/lng, try to geocode it
      if (address.trim() && lat === null && lng === null) {
        try {
          // Added &countrycodes=in for India to help it find places like "ponnamalle" more reliably.
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}&limit=1&addressdetails=1&countrycodes=in`, {
            headers: {
              'User-Agent': 'FoodManagementApp/1.0',
            }
          });
          const data = await res.json();
          if (data && data.length > 0) {
            finalLat = parseFloat(data[0].lat);
            finalLng = parseFloat(data[0].lon);
          } else {
             console.warn("Geocoding returned empty results for exact address:", address);
             
             // Fallback: Try stripping the first part (often a very specific door number like "12,")
             const addressParts = address.split(',').map(p => p.trim()).filter(p => p);
             if (addressParts.length > 1) {
               const fallbackAddress = addressParts.slice(1).join(', ');
               console.log("Retrying geocoding with broader address:", fallbackAddress);
               
               const fbRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}&limit=1&addressdetails=1&countrycodes=in`, {
                 headers: {
                   'User-Agent': 'FoodManagementApp/1.0',
                 }
               });
               const fbData = await fbRes.json();
               if (fbData && fbData.length > 0) {
                 finalLat = parseFloat(fbData[0].lat);
                 finalLng = parseFloat(fbData[0].lon);
                 console.log("Fallback geocoding successful!");
               } else {
                 console.warn("Fallback geocoding also failed.");
               }
             }
          }
        } catch (geoErr) {
          console.error("Geocoding failed:", geoErr);
          // Non-fatal, we just proceed without coordinates
        }
      }

      const insertData: any = {
        donor_id: user.id,
        food_item: foodItem.trim(),
        food_type: foodType,
        quantity: parseFloat(quantity),
        unit,
        description: description.trim() || null,
        expires_at: new Date(expiresAt).toISOString(),
        address: address.trim() || null,
        image_url: finalImageUrl.trim() || null,
        status: 'available',
      };

      // Add location as PostGIS point if we have coords
      if (finalLat && finalLng) {
        insertData.lat = finalLat;
        insertData.lng = finalLng;
      }

      const { error } = await supabase.from('listings').insert(insertData);
      if (error) throw error;

      toast.success('Food donation posted successfully! 🌱');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post donation');
    } finally {
      setLoading(false);
    }
  };

  // Minimum datetime for expiry (now)
  const minDatetime = new Date().toISOString().slice(0, 16);

  return (
    <div className="donate-page">
      <div className="donate-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} /> Back
        </button>

        <div className="donate-header">
          <div className="donate-icon-wrap">
            <Leaf size={32} />
          </div>
          <h1>Donate Food</h1>
          <p>Share your surplus food with those who need it most</p>
        </div>

        <form onSubmit={handleSubmit} className="donate-form">
          {/* Food Details */}
          <div className="form-section">
            <h2 className="form-section-title">
              <Package size={18} /> Food Details
            </h2>
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="foodItem">Food Item Name *</label>
                <input
                  id="foodItem"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Biryani, Bread Rolls, Mixed Vegetables"
                  value={foodItem}
                  onChange={e => setFoodItem(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Food Type *</label>
              <div className="type-selector">
                {FOOD_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`type-chip ${foodType === t ? 'active' : ''} type-${t.replace('-','').toLowerCase()}`}
                    onClick={() => setFoodType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  id="quantity"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="unit">Unit</label>
                <select
                  id="unit"
                  className="form-input"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-textarea"
                placeholder="Any additional details about the food, allergens, preparation..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Timing */}
          <div className="form-section">
            <h2 className="form-section-title">
              <Clock size={18} /> Availability Window
            </h2>
            <div className="form-group">
              <label htmlFor="expiresAt">Best Before / Expiry Time *</label>
              <input
                id="expiresAt"
                type="datetime-local"
                className="form-input"
                min={minDatetime}
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                required
              />
              <span className="form-hint">When should this food be collected by?</span>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h2 className="form-section-title">
              <MapPin size={18} /> Pickup Location
            </h2>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                className="form-input"
                placeholder="e.g. 12, MG Road, Bengaluru"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            
            <div className="map-picker-container" style={{ height: '300px', width: '100%', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
               <MapContainer center={[20.5937, 78.9629]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <MapPanController position={mapPosition} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPickerMarker 
                    position={mapPosition} 
                    setPosition={handleMapPositionChange}
                    setAddress={setAddress}
                  />
               </MapContainer>
            </div>

            <button type="button" className="btn-locate" onClick={getLocation} disabled={gettingLocation}>
              <Navigation size={16} />
              {gettingLocation ? 'Getting Location...' : lat ? `📍 Located (${lat.toFixed(4)}, ${lng?.toFixed(4)})` : 'Use My Current Location'}
            </button>
          </div>

          {/* Physical Photo Upload */}
          <div className="form-section">
            <h2 className="form-section-title">
              <Camera size={18} /> Photo (Required)
            </h2>
            <div className="form-group">
              <label>Upload a clear photo of the food</label>
              
              {!imagePreview ? (
                <div className="upload-placeholder" onClick={() => document.getElementById('fileUpload')?.click()}>
                  <Upload size={32} />
                  <span>Click to upload photo</span>
                  <input 
                    id="fileUpload"
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="image-preview-wrapper">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <button 
                    type="button" 
                    className="remove-img-btn" 
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="donate-submit-wrap">
            <button type="submit" className="btn-donate-submit" disabled={loading}>
              {loading ? 'Posting...' : '🌱 Post Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Donate;
