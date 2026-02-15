import React from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import usePosts from '../hooks/FetchPosts';
import { useCurrentUser } from '../UserProvider/UserProvider';
import NewsFeed from '../components/NewsFeed';

function Trending() {
    const { posts, updatePosts } = usePosts();
    const { loggedIn } = useCurrentUser();
    const handleAddPost = () => {
        updatePosts(); // Trigger refetch after adding a post
    };

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {loggedIn && <PostModal onAddPost={handleAddPost} />}
            <PostList posts={posts} onAddPost={handleAddPost} />
            <NewsFeed />
        </div>
    )
}

export default Trending;