import React, { useState, useEffect } from 'react';
import { images } from '../constants';
import Reply from './Reply';
import AddReplyModal from '../utils/AddReplyModal';
import axios from 'axios';
import { baseUrl } from '../shared';
import LikeButton from '../utils/LikeButton';
import EditDeleteModal from '../utils/EditDeleteModal';
import EditCommentModal from '../utils/EditCommentModal';

function Comment({ postId, lastUpdatedComment, onAddPost, user }) {

    const [comments, setComments] = useState([]);
    //console.log("comments", comments);
    const [error, setError] = useState(null);
    const [commentLikes, setCommentLikes] = useState({});
    const [modalIsOpen, setModalIsOpen] = useState(null);
    const [commentIdToDelete, setCommentIdToDelete] = useState(null);
    const [commentToEdit, setCommentToEdit] = useState(null);
    const [commentIdToEdit, setCommentIdToEdit] = useState(null);

    const updateLikeStatus = (commentId, isLiked) => {
        setCommentLikes((prevCommentLikes) => ({ ...prevCommentLikes, [commentId]: isLiked }));
        onAddPost(); // Update the post list when a like status changes
    };


    const refetchComments = async () => {
        try {
            const response = await axios.get(`${baseUrl}api/posts/${postId}/comments/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            setComments(response.data);
        } catch (error) {
            setError(error);
        }
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/posts/${postId}/comments/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    },
                });
                setComments(response.data);
            } catch (error) {
                setError(error);
            }
        };
        fetchComments();
    }, [postId, lastUpdatedComment]);


    const [lastUpdatedReply, setLastUpdatedReply] = useState(null);

    const updateReplies = (time) => {
        setLastUpdatedReply(time);
        onAddPost();
    };

    const handleOpenModal = (commentId) => {
        setModalIsOpen(commentId);
    };

    const handleCloseModal = () => {
        setModalIsOpen(null);
        setCommentToEdit(null);
    };

    const handleEditComment = async (commentId) => {
        console.log('Editing comment:', commentId);
        try {
            const response = await axios.get(`${baseUrl}api/comments/${commentId}/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            setCommentToEdit(response.data);
            setCommentIdToEdit(commentId);
            setModalIsOpen(true);
        } catch (error) {
            console.error('Error fetching comment data:', error);
        }
    };

    const handleDeleteComment = (commentId) => {
        setCommentIdToDelete(commentId);
        handleCloseModal();
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${baseUrl}api/comments/${commentIdToDelete}/delete/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            refetchComments(postId);
            alert("Comment deleted successfully!");
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setCommentIdToDelete(null);
        }
    };


    if (postId === undefined || postId === null) {
        return <div>Loading comments... </div>;
    }

    if (error) {
        return <div>Error loading comments: {error.message}</div>;
    }


    return (
        <div>
            <hr className="mt-2 mb-2" />
            <div className="mt-4 grid grid-cols-1 gap-x-2 border border-gray-200 rounded">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        comment &&
                        <>
                            <div key={comment.id} className="flex justify-between items-center space-x-2 mt-2 pb-2">
                                <div className="flex items-center space-x-2">
                                    <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                                    <div className="mb-2">
                                        <p className="text-gray-800 font-semibold">{comment.author.username}</p>
                                        <p className="text-gray-500 text-sm">{comment.content}</p>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <button className="flex justify-center items-center gap-2 px-2 hover:bg-gray-50 rounded-full p-1">
                                        <svg className={`w-5 h-5 fill-current ${commentLikes[comment.id] ? 'fill-pink-500' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C6.11 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-4.11 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        <span>{comment.likes_count} Like</span>
                                    </button>
                                    <AddReplyModal commentId={comment.id} onAddReply={updateReplies} />
                                    <LikeButton contentType="comment" objectId={comment.id} onLikeStatusChange={updateLikeStatus} refetchComments={refetchComments} />
                                </div>
                                <div className="text-gray-500 cursor-pointer relative">
                                    {comment.author.id === user?.id && (
                                        <button onClick={() => handleOpenModal(comment.id)} className="hover:bg-gray-50 rounded-full p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="7" r="1" />
                                                <circle cx="12" cy="12" r="1" />
                                                <circle cx="12" cy="17" r="1" />
                                            </svg>
                                        </button>
                                    )}
                                    <EditDeleteModal
                                        isOpen={modalIsOpen === comment.id}
                                        onClose={handleCloseModal}
                                        onEdit={() => handleEditComment(comment.id)}
                                        onDelete={() => handleDeleteComment(comment.id)}
                                        itemId={comment.id}
                                        itemType="comment"
                                        handleConfirmDelete={handleConfirmDelete}
                                        postIdToDelete={commentIdToDelete}
                                        handleCloseModal={handleCloseModal}
                                    />
                                </div>
                                {commentIdToEdit &&
                                    <EditCommentModal comment={commentToEdit} isOpen={modalIsOpen} onClose={handleCloseModal} onAddPost={onAddPost} refetchComments={refetchComments} />
                                }

                            </div>
                            <Reply commentId={comment.id} lastUpdatedReply={lastUpdatedReply} onAddPost={onAddPost} />
                        </>
                    ))
                ) : (
                    <p className="text-gray-500 text-center p-4">No comments yet.</p>
                )}
            </div>
            {commentIdToDelete && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-500 bg-opacity-75">
                    <div className="bg-primary border border-black text-black px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Confirmation Required</strong><br />
                        <span className="block sm:inline">Are you sure you want to delete this {comments.find(comment => comment.id === commentIdToDelete)?.itemType}?</span>
                        <div className="flex justify-end mt-2">
                            <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2" onClick={handleConfirmDelete}>Confirm</button>
                            <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded" onClick={() => setCommentIdToDelete(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>)
}

export default Comment;