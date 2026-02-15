import React, { useState, useEffect } from 'react';
import { images } from "../constants";
import CommentModal from '../utils/CommentModal';
import Comment from './Comment';
import EditDeleteModal from '../utils/EditDeleteModal';
import LikeButton from '../utils/LikeButton';
import timeSince from '../utils/TimeStamp';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';
import EditPostModal from '../utils/EditPostModal';
import { useNavigate } from 'react-router-dom';

const PostList = ({ posts, onAddPost }) => {
    const { user, fetchUser } = useCurrentUser();
    const navigate = useNavigate();
    const [otherUser, setOtherUser] = useState(null);
    // console.log("otherUser", otherUser);

    useEffect(() => {
        fetchUser();
    }, []);

    const handleNavigateToProfile = async (authorId) => {
        try {
            const response = await axios.get(`${baseUrl}api/users/${authorId}/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            if (authorId !== user.id) {
                setOtherUser(response.data);
                console.log('Other user reponse:', response.data);
            }

        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        if (otherUser) {
            navigate(`/profile/${otherUser.id}`, { state: { otherUser } });
        }
    }, [otherUser])

    const [postLikes, setPostLikes] = useState({}); // State to track likes for each post

    const updateLikeStatus = (postId, isLiked) => {
        setPostLikes((prevPostLikes) => ({ ...prevPostLikes, [postId]: isLiked }));
        onAddPost(); // Update the post list when a like status changes
    };

    const [modalIsOpen, setModalIsOpen] = useState(null);
    const [postIdToDelete, setPostIdToDelete] = useState(null);
    const [postIdToEdit, setPostIdToEdit] = useState(null);
    const [postToEdit, setPostToEdit] = useState(null);

    const handleOpenModal = (postId) => {
        setModalIsOpen(postId);
    };

    const handleEditPost = async (postId) => {
        try {
            const response = await axios.get(`${baseUrl}api/posts/${postId}/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            setPostIdToEdit(postId);
            setPostToEdit(response.data);
            //console.log('Post to edit:', response.data);
            setModalIsOpen(true);
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    };

    const handleCloseModal = () => {
        setModalIsOpen(false);
        setPostToEdit(null);
    };


    const handleDeletePost = (postId) => {
        setPostIdToDelete(postId);
        console.log('Post to delete:', postId);
        handleCloseModal();
    };

    const handleConfirmDelete = async () => {
        console.log('Deleting post');
        try {
            await axios.delete(`${baseUrl}api/posts/${postIdToDelete}/delete/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            onAddPost(); // Update the post list when a post is deleted
            // alert("Post deleted successfully!");
        } catch (error) {
            console.error('Error deleting post:', error);
        } finally {
            setPostIdToDelete(null);
        }
    };

    const [lastUpdatedComment, setLastUpdatedComment] = useState(null);

    const updateComments = (time) => {
        setLastUpdatedComment(time);
        onAddPost(); // Update the post list when a comment is added
    };



    const [visibleComments, setVisibleComments] = useState({});

    const toggleComments = (postId) => {
        setVisibleComments((prev) => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const handleShare = async (post) => {
        try {
            const username = post.author?.username || "Someone";
            const contentText = post.content ? post.content.substring(0, 100) : (post.title || "Check this out");

            const shareData = {
                title: `Check out ${username}'s post`,
                text: contentText,
                url: window.location.href,
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                throw new Error("Web Share Web API not supported or data not valid");
            }
        } catch (err) {
            console.log('Share failed/unsupported, attempting clipboard copy:', err);
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            } catch (clipboardErr) {
                console.warn('Clipboard write failed, showing prompt:', clipboardErr);
                window.prompt('Copy this link:', window.location.href);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-center gap-3 mb-8">
                <div className="p-3 bg-gray-100 rounded-full shadow-inner">
                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 via-gray-900 to-black tracking-tight drop-shadow-sm">Trending</h1>
            </div>
            <div className="flex flex-col items-center">
                {posts?.map((item) => {
                    if (item.isNews) {
                        return (
                            <div key={`news-${item.article_id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl w-full mb-6 relative overflow-hidden group">
                                <div className="p-5 flex items-center gap-2 border-b border-gray-50">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">News</span>
                                    <span className="text-gray-400 text-xs">Suggested for you</span>
                                </div>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                                    <div className="relative">
                                        <img
                                            src={item.image_url || images.toss}
                                            alt={item.title}
                                            className="w-full h-48 sm:h-64 object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = images.toss; }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                            {/* Gradient overlay for readability if needed */}
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 truncate">{new URL(item.link).hostname.replace('www.', '')}</p>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                                    </div>
                                </a>
                                <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-white">
                                    <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                    </button>
                                    <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    const post = item;
                    return (
                        <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl w-full mb-6 relative overflow-visible">
                            {/* Header */}
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => {
                                    if (!user) {
                                        navigate('/login');
                                    } else if (post.author.id !== user.id) {
                                        handleNavigateToProfile(post.author.id)
                                    } else {
                                        navigate('/profile/')
                                    }
                                }}>
                                    <img src={post.author.image ? `${baseUrl}${post.author.image.startsWith('/') ? post.author.image.substring(1) : post.author.image}` : images.profile} alt="User Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                    <div>
                                        <p className="text-gray-900 font-semibold text-sm hover:underline">{post.author.username}</p>
                                        <p className="text-gray-500 text-xs">{timeSince(post.created_at)}</p>
                                    </div>
                                </div>
                                <div className="text-gray-400 cursor-pointer relative">
                                    {post.author.id === user?.id && (
                                        <button onClick={() => handleOpenModal(post.id)} className="hover:bg-gray-100 rounded-full p-2 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="7" r="1" />
                                                <circle cx="12" cy="12" r="1" />
                                                <circle cx="12" cy="17" r="1" />
                                            </svg>
                                        </button>
                                    )}
                                    <div className="absolute top-8 right-0 z-10 w-48">
                                        <EditDeleteModal isOpen={modalIsOpen === post.id} onClose={handleCloseModal} onEdit={() => handleEditPost(post.id)} onDelete={() => handleDeletePost(post.id)} itemId={post.id} itemType="post" handleConfirmDelete={handleConfirmDelete} postIdToDelete={postIdToDelete} handleCloseModal={handleCloseModal} />
                                    </div>
                                    {postIdToEdit &&
                                        <EditPostModal post={postToEdit} isOpen={modalIsOpen} onClose={handleCloseModal} onAddPost={onAddPost} />
                                    }
                                </div>
                            </div>

                            {/* Inner Content Container */}
                            <div className="mx-6 mb-4 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                {/* Content */}
                                <div className="p-4">
                                    {post.title && <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">{post.title}</h3>}
                                    <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                </div>

                                {/* Image */}
                                {post.image && (
                                    <div className="w-full relative group">
                                        <img
                                            src={post.image.startsWith('http') ? post.image : `${baseUrl}${post.image.startsWith('/') ? post.image.substring(1) : post.image}`}
                                            alt="Post Content"
                                            className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 hover:scale-[1.01]"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="px-6 py-3 flex items-center justify-between text-sm text-gray-500 border-b border-gray-50">
                                <div className="flex items-center gap-1">
                                    {post.likes_count > 0 && (
                                        <>
                                            <div className="p-1 bg-black-100 rounded-full">
                                                <svg className="w-3 h-3 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" /></svg>
                                            </div>
                                            <span>{post.likes_count}</span>
                                        </>
                                    )}
                                </div>
                                <div className="hover:underline cursor-pointer" onClick={() => toggleComments(post.id)}>
                                    {post.comment_count + (post.reply_count || 0) > 0 ? `${post.comment_count + (post.reply_count || 0)} Comments` : ''}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100">
                                {user ? (
                                    <LikeButton
                                        contentType="post"
                                        objectId={post.id}
                                        onLikeStatusChange={updateLikeStatus}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${postLikes[post.id] ? 'text-black-100 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <svg className={`w-5 h-5 ${postLikes[post.id] ? 'fill-current' : 'fill-none stroke-current'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                        </svg>
                                        <span>Like</span>
                                    </LikeButton>
                                ) : (
                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 cursor-not-allowed">
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                        <span>Like</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
                                >
                                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>Comment</span>
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleShare(post); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
                                >
                                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <span>Share</span>
                                </button>
                            </div>

                            {/* Comments Section */}
                            {visibleComments[post.id] && (
                                <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                                    {user && (
                                        <div className="flex flex-row items-center mb-4">
                                            <CommentModal postId={post.id} onAddComment={updateComments} />
                                        </div>
                                    )}
                                    <Comment postId={post.id} lastUpdatedComment={lastUpdatedComment} onAddPost={onAddPost} user={user} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            {postIdToDelete && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-500 bg-opacity-75">
                    <div className="bg-primary border border-black text-black px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Confirmation Required</strong><br />
                        <span className="block sm:inline">Are you sure you want to delete this {posts.find(post => post.id === postIdToDelete)?.itemType}?</span>
                        <div className="flex justify-end mt-2">
                            <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2" onClick={handleConfirmDelete}>Confirm</button>
                            <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded" onClick={() => setPostIdToDelete(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default PostList;
