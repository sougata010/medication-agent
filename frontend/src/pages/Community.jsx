import React, { useState, useEffect } from 'react';
import { Users, Search, Heart, MessageCircle, Share2, Plus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../context/GlobalContext';

export default function Community() {
  const { fetchCommunityPosts, createCommunityPost } = useGlobalContext();
  const [posts, setPosts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await fetchCommunityPosts();
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    const tagsArray = newPostTags.split(',').map(t => t.trim()).filter(Boolean);
    const success = await createCommunityPost(newPostContent, tagsArray);
    if (success) {
      setNewPostContent('');
      setNewPostTags('');
      setIsCreating(false);
      loadPosts();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-black text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8 text-indigo-600" />
              Anonymous Peer Support
            </h1>
            <p className="text-gray-500 mt-1">Connect with others on similar health journeys securely and anonymously.</p>
          </div>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-colors"
          >
            <Plus className={`w-4 h-4 transition-transform ${isCreating ? 'rotate-45' : ''}`} />
            {isCreating ? 'Cancel' : 'New Post'}
          </button>
        </div>
        
        {/* Create Post Section */}
        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-2">
                <textarea 
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  placeholder="Share your health journey, ask a question, or provide a tip..."
                  className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 min-h-[100px]"
                />
                <div className="flex gap-3">
                  <input 
                    type="text"
                    value={newPostTags}
                    onChange={e => setNewPostTags(e.target.value)}
                    placeholder="Tags (comma separated e.g. Sleep, Metformin)"
                    className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    onClick={handleCreatePost}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search discussions by medication, condition, or side effect..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
            />
          </div>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Filter
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 font-medium">Loading community discussions...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-medium">No posts found. Be the first to start a discussion!</div>
        ) : posts.map((post, i) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-50 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{post.author}</h3>
                  <span className="text-xs text-gray-400 font-medium">{new Date(parseInt(post.createdAt)).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{post.content}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
              <button className="flex items-center gap-2 text-gray-500 hover:text-rose-500 transition-colors text-sm font-medium">
                <Heart className="w-4 h-4" />
                {post.likes}
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-500 transition-colors text-sm font-medium">
                <MessageCircle className="w-4 h-4" />
                {post.comments} Comments
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors text-sm font-medium ml-auto">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
