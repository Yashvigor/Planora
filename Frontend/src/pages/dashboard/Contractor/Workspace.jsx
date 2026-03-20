import React, { useState } from 'react';
import { Camera, Calendar, Clock, Upload, CheckSquare } from 'lucide-react';

const Workspace = () => {
    const [activeTab, setActiveTab] = useState('progress');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: Tasks & Schedule */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center space-x-4 bg-white p-2 rounded-lg shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'progress' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Daily Progress
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'schedule' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Labor Schedule
                    </button>
                </div>

                {activeTab === 'progress' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Today's Site Update</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Work Description</label>
                                <textarea
                                    className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Describe what was accomplished today..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Site Photos</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Camera className="text-blue-600 w-6 h-6" />
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">Click to upload or drag & drop</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                </div>
                            </div>

                            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                                Submit Daily Report
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Weekly Labor Schedule</h2>
                            <button className="text-blue-600 text-sm font-medium hover:underline">+ Add Shift</button>
                        </div>

                        <div className="space-y-3">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                <div key={day} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="text-gray-400 w-5 h-5" />
                                        <span className="font-medium text-gray-700">{day}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <span className="flex items-center"><Clock size={14} className="mr-1" /> 08:00 AM - 05:00 PM</span>
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">8 Workers</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Recent Activity */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Pending Tasks</h3>
                    <ul className="space-y-3">
                        {['Inspect foundation', 'Order cement bags', 'Safety meeting'].map((task, i) => (
                            <li key={i} className="flex items-start space-x-3">
                                <div className="mt-0.5">
                                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                </div>
                                <span className="text-sm text-gray-600">{task}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <h3 className="font-bold mb-2">Weather Alert</h3>
                    <p className="text-sm text-blue-100 mb-4">Heavy rain expected tomorrow. Ensure all materials are covered.</p>
                    <button className="w-full bg-white text-blue-600 py-2 rounded-lg text-sm font-semibold">View Details</button>
                </div>
            </div>
        </div>
    );
};

export default Workspace;
