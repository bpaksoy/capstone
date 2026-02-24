import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import PostList from './PostList';
import PostModal from '../utils/PostModal';
import { useCurrentUser } from '../UserProvider/UserProvider';
import Loader from './Loader';

const CollegeHub = ({ collegeId, collegeName }) => {
    const { user, loggedIn } = useCurrentUser();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    const fetchHubPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${baseUrl}api/posts/?college_id=${collegeId}`, {
                headers: headers
            });
            setPosts(response.data);
        } catch (error) {
            console.error("Error fetching hub posts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [collegeId]);

    useEffect(() => {
        fetchHubPosts();
    }, [fetchHubPosts]);

    const handleAddPost = () => {
        fetchHubPosts();
    };

    if (isLoading && posts.length === 0) {
        return <Loader text={`Entering ${collegeName} Hub...`} />;
    }

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-6">
            <div className="w-full max-w-2xl mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{collegeName} Community Hub</h2>
                <p className="text-gray-500 text-sm">Connect with current students and fellow applicants at {collegeName}.</p>
            </div>

            {loggedIn && (
                <PostModal
                    onAddPost={handleAddPost}
                    isOpen={isPostModalOpen}
                    onClose={() => setIsPostModalOpen(false)}
                    triggerOpen={() => setIsPostModalOpen(true)}
                    collegeId={collegeId}
                />
            )}

            {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 w-full max-w-2xl px-6">
                    <div className="p-3 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No posts here yet</h3>
                    <p className="text-gray-500 text-sm mb-6">Be the first to start a conversation in the {collegeName} hub!</p>
                </div>
            ) : (
                <div className="w-full">
                    <PostList
                        posts={posts}
                        onAddPost={handleAddPost}
                        onOpenPostModal={(content) => {
                            // This could be used for replying or sharing within the hub
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default CollegeHub;
