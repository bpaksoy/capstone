import React from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import usePosts from '../hooks/FetchPosts';

function Trending() {
    const { posts, updatePosts } = usePosts();
    const handleAddPost = () => {
        updatePosts(); // Trigger refetch after adding a post
    };

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <PostModal onAddPost={handleAddPost} />
            <PostList posts={posts} onAddPost={handleAddPost} />
        </div>
    )
}

export default Trending;