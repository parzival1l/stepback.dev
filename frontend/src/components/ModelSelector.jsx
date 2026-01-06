import React, { useState, useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const API_URL = "http://localhost:8000";

const ModelSelector = ({ selectedModel, onModelSelect, onStart }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
            <Card className="w-full max-w-md border-border/50 shadow-xl">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mx-auto">
                        <Sparkles size={28} className="text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Choose Your Model</CardTitle>
                        <CardDescription className="mt-2">
                            Select an AI model to start your conversation
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {/* Model Selector using shadcn Select */}
                    <Select value={selectedModel} onValueChange={onModelSelect}>
                        <SelectTrigger className="w-full h-auto py-3 px-4 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Sparkles size={18} className="text-primary" />
                                </div>
                                <div className="text-left">
                                    <SelectValue placeholder="Select a model">
                                        {selectedModelConfig ? (
                                            <>
                                                <div className="font-semibold">{selectedModelConfig.name}</div>
                                                <div className="text-xs text-muted-foreground">{selectedModelConfig.description}</div>
                                            </>
                                        ) : (
                                            "Select a model"
                                        )}
                                    </SelectValue>
                                </div>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {models.map((model) => (
                                <SelectItem
                                    key={model.id}
                                    value={model.id}
                                    className="py-3 px-3 rounded-lg cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                            selectedModel === model.id ? "bg-primary/20" : "bg-muted"
                                        )}>
                                            <Sparkles size={18} className={selectedModel === model.id ? "text-primary" : "text-muted-foreground"} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">{model.name}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{model.description}</div>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Start Button */}
                    {selectedModel && (
                        <Button
                            onClick={onStart}
                            className="w-full py-6 rounded-xl text-base font-semibold shadow-lg"
                            size="lg"
                        >
                            Start Chatting
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ModelSelector;
