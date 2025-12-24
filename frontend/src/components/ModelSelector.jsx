import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

const API_URL = "http://localhost:8000";

const ModelSelector = ({ selectedModel, onModelSelect, onStart }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const res = await fetch(`${API_URL}/models`);
            const data = await res.json();
            setModels(data.models || []);
            // Set default model if none selected
            if (!selectedModel && data.models && data.models.length > 0) {
                onModelSelect(data.models[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch models", err);
        } finally {
            setLoading(false);
        }
    };

    const selectedModelConfig = models.find(m => m.id === selectedModel);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="flex gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
                        <Sparkles size={28} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Choose Your Model
                    </h2>
                    <p className="text-sm text-slate-500">
                        Select an AI model to start your conversation
                    </p>
                </div>

                {/* Model Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl px-4 py-3.5
                            flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-300/60
                            transition-all duration-200 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                                <Sparkles size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">
                                    {selectedModelConfig?.name || "Select a model"}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {selectedModelConfig?.description || ""}
                                </div>
                            </div>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-200/50
                            border border-slate-200/60 rounded-xl overflow-hidden z-20 animate-slide-in-from-bottom">
                            {models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelSelect(model.id);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-150
                                        ${selectedModel === model.id
                                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                        ${selectedModel === model.id ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                        <Sparkles size={18} className={selectedModel === model.id ? 'text-blue-600' : 'text-slate-500'} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">{model.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{model.description}</div>
                                    </div>
                                    {selectedModel === model.id && (
                                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Start Button */}
                {selectedModel && (
                    <button
                        onClick={onStart}
                        className="w-full gradient-primary text-white px-6 py-3.5 rounded-xl
                            font-semibold shadow-lg shadow-blue-500/20
                            hover:brightness-110 active:scale-95
                            transition-all duration-200"
                    >
                        Start Chatting
                    </button>
                )}
            </div>
        </div>
    );
};

export default ModelSelector;

