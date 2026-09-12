import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaRegClock, FaTicketAlt, FaShieldAlt, FaHeart } from 'react-icons/fa';

const heroImage = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80';

const Home = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ category: '', free: '', sort: 'date' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 400); // 400ms debounce
        return () => clearTimeout(timeoutId);
    }, [search, filters]);

    useEffect(() => {
        if (!user) return;
        const fetchWishlist = async () => {
            try {
                const { data } = await api.get('/users/wishlist');
                setWishlist(Array.isArray(data) ? data.map((item) => item._id || item) : []);
            } catch (error) {
                console.error('Error fetching wishlist', error);
            }
        };
        fetchWishlist();
    }, [user]);

    const fetchEvents = async () => {
        try {
            const params = new URLSearchParams({ search, sort: filters.sort });
            if (filters.category) params.set('category', filters.category);
            if (filters.free) params.set('free', filters.free);
            const { data } = await api.get(`/events?${params.toString()}`);
            setEvents(Array.isArray(data) ? data : data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleWishlist = async (eventId) => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        try {
            const { data } = await api.post(`/users/wishlist/${eventId}`);
            if (data.isSaved) {
                setWishlist((prev) => [...prev, eventId]);
            } else {
                setWishlist((prev) => prev.filter((id) => id !== eventId));
            }
        } catch (error) {
            console.error('Error toggling wishlist', error);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <div className="relative bg-black text-white rounded-3xl overflow-hidden mb-12 shadow-2xl">
                <img
                    src={heroImage}
                    alt="Event background"
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                <div className="relative p-10 md:p-20 text-center flex flex-col items-center z-10">
                    <span className="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">Welcome to Eventora</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg">
                        Find Your Next <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Unforgettable</span> Experience
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        Discover the best tech conferences, late-night music festivals, and hands-on workshops happening directly in your area. Secure your spot today.
                    </p>

                    <div className="w-full max-w-2xl mx-auto relative flex items-center shadow-2xl group">
                        <FaSearch className="absolute left-6 text-gray-500 text-xl group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events by title..."
                            className="w-full pl-16 pr-6 py-5 rounded-full text-lg text-black bg-white/95 backdrop-blur-sm border-2 border-transparent focus:border-gray-500 focus:outline-none transition-all placeholder-gray-400 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Why Choose Us / Features row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md shadow-gray-200/50">
                        <FaRegClock />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Booking</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Secure your tickets instantly with our fast streamlined booking infrastructure built for speed.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md shadow-gray-200/50">
                        <FaTicketAlt />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Seamless Access</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Download tickets instantly or manage them right from your personal dashboard with easily.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md shadow-gray-200/50">
                        <FaShieldAlt />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Platform</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">All transactions and registrations are bounded by cutting-edge security and 2FA OTP tech.</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8 px-2 border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-extrabold text-gray-900">Upcoming Events</h2>
                <div className="flex flex-wrap gap-2 justify-end">
                    <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                        <option value="">All categories</option>
                        <option value="Music">Music</option>
                        <option value="Technology">Technology</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Sports">Sports</option>
                    </select>
                    <select value={filters.free} onChange={(e) => setFilters({ ...filters, free: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                        <option value="">All prices</option>
                        <option value="true">Free</option>
                        <option value="false">Paid</option>
                    </select>
                    <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                        <option value="date">Soonest</option>
                        <option value="popular">Popular</option>
                        <option value="priceAsc">Price: low to high</option>
                        <option value="priceDesc">Price: high to low</option>
                    </select>
                    <span className="self-center text-gray-500 font-medium text-sm">{events.length} results</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-xl font-semibold text-gray-600">Loading events...</div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 text-xl text-gray-500">No events found matching your search.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map(event => (
                        <div key={event._id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition flex flex-col">
                            <div className="h-48 bg-gray-200 overflow-hidden relative">
                                {event.image && event.image.trim() ? (
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.querySelector('.fallback-image').style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`w-full h-full items-center justify-center bg-gray-200 text-gray-600 font-bold text-2xl ${event.image && event.image.trim() ? 'hidden fallback-image' : 'flex'}`}>
                                    {event.category || 'Event'}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleWishlist(event._id)}
                                    className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${wishlist.includes(event._id) ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}
                                    aria-label="Toggle wishlist"
                                >
                                    <FaHeart />
                                </button>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                    {event.ticketPrice === 0 ? <span className="text-green-600">FREE</span> : <span className="text-gray-900">₹{event.ticketPrice}</span>}
                                </div>
                            </div>
                            <div className="p-6 flex-grow flex flex-col">
                                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{event.category}</div>
                                <h2 className="text-xl font-bold text-gray-800 mb-3">{event.title}</h2>
                                <div className="flex items-center gap-2 mb-3 text-sm">
                                    <div className="flex text-yellow-500">
                                        {Array.from({ length: 5 }, (_, idx) => (
                                            <span key={idx} className={idx < Math.round(Number(event.averageRating || 0)) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                                        ))}
                                    </div>
                                    <span className="text-gray-700 font-medium">
                                        {Number(event.averageRating || 0) > 0 ? Number(event.averageRating).toFixed(1) : 'New'}
                                    </span>
                                    <span className="text-gray-400">({event.ratingCount || 0})</span>
                                </div>
                                <div className="flex flex-col gap-2 mb-4 text-gray-600 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400" />
                                        <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-gray-400" />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div className="bg-gray-700 h-2 rounded-full" style={{ width: `${(event.availableSeats / event.totalSeats) * 100}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">{event.availableSeats} of {event.totalSeats} seats remaining</p>
                                    <Link to={`/events/${event._id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg transition">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer Section */}
            <footer className="mt-auto pt-16 pb-8 border-t border-gray-200 text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <FaTicketAlt className="text-gray-800 text-2xl" />
                    <span className="text-xl font-bold text-gray-900">Eventora</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    The simplest, most dynamic way to manage, discover, and host world-class events in your local city. Let's make memories together.
                </p>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    &copy; {new Date().getFullYear()} Eventora Platform. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
