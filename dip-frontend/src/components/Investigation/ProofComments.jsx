import React, { useState } from 'react';
import { MessageSquare, Send, User, X } from 'lucide-react';
import clsx from 'clsx';

const ProofComments = ({ proofId, comments = [], onAddComment, onRemoveComment, canComment = true }) => {
    const [newComment, setNewComment] = useState('');

    const handleAddComment = () => {
        if (newComment.trim()) {
            onAddComment && onAddComment(proofId, {
                id: `comment_${Date.now()}`,
                text: newComment.trim(),
                author: 'Você',
                createdAt: new Date().toISOString()
            });
            setNewComment('');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                <MessageSquare size={16} />
                Comentários ({comments.length})
            </div>

            {canComment && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        placeholder="Adicionar comentário..."
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:border-federal-500 outline-none"
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-federal-600 hover:bg-federal-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum comentário ainda. Seja o primeiro!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 bg-federal-600 rounded-full flex items-center justify-center">
                                        <User size={12} className="text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300">{comment.author}</span>
                                    <span className="text-[10px] text-slate-500">
                                        {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                
                                {onRemoveComment && (
                                    <button
                                        onClick={() => onRemoveComment(proofId, comment.id)}
                                        className="text-slate-500 hover:text-red-400"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{comment.text}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProofComments;