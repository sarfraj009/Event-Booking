import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
    const { user, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [profile, setProfile] = useState({ name: '', phone: '', city: '', bio: '', profileImage: '' });
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        api.get('/users/profile')
            .then(({ data }) => setProfile({
                name: data.name || '',
                phone: data.phone || '',
                city: data.city || '',
                bio: data.bio || '',
                profileImage: data.profileImage || ''
            }))
            .catch(() => setError('Unable to load profile.'));
    }, [user, navigate]);

    const saveProfile = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const { data } = await api.put('/users/profile', profile);
            updateUser(data);
            setMessage('Profile updated successfully.');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        try {
            await api.put('/users/password', passwords);
            setPasswords({ currentPassword: '', newPassword: '' });
            setMessage('Password changed successfully.');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to change password.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Profile Settings</h1>
                <p className="text-gray-500 mt-1">Manage your Eventora account details.</p>
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
            {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">{message}</div>}

            <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-xl font-bold text-gray-900">Personal details</h2>
                <div className="grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-semibold text-gray-700">Full name
                        <input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-gray-700" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">Phone
                        <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-gray-700" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">City
                        <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-gray-700" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">Profile image URL
                        <input type="url" value={profile.profileImage} onChange={(e) => setProfile({ ...profile, profileImage: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-gray-700" />
                    </label>
                </div>
                <label className="block text-sm font-semibold text-gray-700">Bio
                    <textarea rows="4" maxLength="500" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-gray-700" />
                </label>
                <button disabled={saving} className="rounded-lg bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black disabled:opacity-60">{saving ? 'Saving...' : 'Save Profile'}</button>
            </form>

            <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-xl font-bold text-gray-900">Change password</h2>
                <label className="block text-sm font-semibold text-gray-700">Current password
                    <input required type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-gray-700" />
                </label>
                <label className="block text-sm font-semibold text-gray-700">New password
                    <input required minLength="8" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-gray-700" />
                </label>
                <button className="rounded-lg border border-gray-900 px-5 py-3 font-bold text-gray-900 hover:bg-gray-100">Change Password</button>
            </form>
        </div>
    );
};

export default Profile;
