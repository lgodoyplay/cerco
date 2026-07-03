import React, { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import clsx from 'clsx';

const TAG_COLORS = [
    'bg-federal-500/20 text-federal-400 border-federal-500/30',
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
];

const ProofTags = ({ tags = [], onTagsChange, editable = false }) => {
    const [newTag, setNewTag] = useState('');
    const [selectedTags, setSelectedTags] = useState(tags);

    const addTag = (tag) => {
        if (tag && !selectedTags.includes(tag)) {
            const updated = [...selectedTags, tag];
            setSelectedTags(updated);
            onTagsChange && onTagsChange(updated);
        }
        setNewTag('');
    };

    const removeTag = (tagToRemove) => {
        const updated = selectedTags.filter(t => t !== tagToRemove);
        setSelectedTags(updated);
        onTagsChange && onTagsChange(updated);
    };

    const getColorForTag = (tag) => {
        const index = tag.charCodeAt(0) % TAG_COLORS.length;
        return TAG_COLORS[index];
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                    <span
                        key={tag}
                        className={clsx(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border",
                            getColorForTag(tag)
                        )}
                    >
                        <Tag size={12} />
                        {tag}
                        {editable && (
                            <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-red-400 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </span>
                ))}
            </div>

            {editable && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag(newTag.trim())}
                        placeholder="Adicionar tag..."
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:border-federal-500 outline-none"
                    />
                    <button
                        onClick={() => addTag(newTag.trim())}
                        disabled={!newTag.trim()}
                        className="px-3 py-1.5 bg-federal-600 hover:bg-federal-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProofTags;