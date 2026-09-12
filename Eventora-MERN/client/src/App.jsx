import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

const Home = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const MyTickets = lazy(() => import('./pages/MyTickets'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Suspense fallback={<div className="text-center py-20 text-xl font-semibold text-gray-600">Loading...</div>}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/events/:id" element={<EventDetail />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={<UserDashboard />} />
                            <Route path="/my-tickets" element={<MyTickets />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/payment-success" element={<PaymentSuccess />} />
                            <Route path="/payment-failed" element={<PaymentFailed />} />
                            <Route path="*" element={<h1 className="text-3xl font-bold text-center mt-20">404 - Page Not Found</h1>} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </Router>
    );
}

export default App;
