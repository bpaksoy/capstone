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
    const [loading, setLoading] = useState(true);

    const updateLikeStatus = (commentId, isLiked) => {
        setCommentLikes((prevCommentLikes) => ({ ...prevCommentLikes, [commentId]: isLiked }));
        onAddPost(); // Update the post list when a like status changes
    };


    const refetchComments = async () => {
        try {
            const token = localStorage.getItem('access');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${baseUrl}api/posts/${postId}/comments/`, {
                headers: headers,
            });
            setComments(response.data);
            setLoading(false);
        } catch (error) {
            setError(error);
        }
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${baseUrl}api/posts/${postId}/comments/`, {
                    headers: headers,
                });
                setComments(response.data);
                setLoading(false);
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
            <div className="mt-4 grid grid-cols-1 gap-y-2">
                {!loading ? (
                    comments.length > 0 ? (
                        comments.map((comment) => (
                            comment &&
                            <React.Fragment key={comment.id}>
                                <div className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start space-x-3">
                                            <img src={images.avatar} alt="User Avatar" className="w-8 h-8 rounded-full mt-1 opacity-60" />
                                            <div>
                                                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm inline-block">
                                                    <p className="text-gray-900 font-semibold text-sm">{comment.author.username}</p>
                                                    <p className="text-gray-700 text-sm">{comment.content}</p>
                                                </div>
                                                {/* Action Row - Now below the bubble */}
                                                <div className="flex items-center space-x-4 mt-1 px-2">
                                                    {user && <LikeButton contentType="comment" objectId={comment.id} onLikeStatusChange={updateLikeStatus} refetchComments={refetchComments} className={`text-xs font-semibold hover:underline ${commentLikes[comment.id] ? 'text-blue-600' : 'text-gray-500'}`} >Like</LikeButton>}
                                                    {user && <AddReplyModal commentId={comment.id} onAddReply={updateReplies} className="text-xs font-semibold text-gray-500 hover:underline" />}
                                                    {comment.likes_count > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <div className="p-0.5 bg-black-100 rounded-full">
                                                                <svg className="w-2 h-2 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" /></svg>
                                                            </div>
                                                            <span>{comment.likes_count}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Edit/Delete Menu */}
                                        <div className="text-gray-400 cursor-pointer relative mt-2">
                                            {comment.author.id === user?.id && (
                                                <button onClick={() => handleOpenModal(comment.id)} className="hover:bg-gray-200 rounded-full p-1 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="1" />
                                                        <circle cx="19" cy="12" r="1" />
                                                        <circle cx="5" cy="12" r="1" />
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
                                    </div>
                                    {commentIdToEdit &&
                                        <EditCommentModal comment={commentToEdit} isOpen={modalIsOpen} onClose={handleCloseModal} onAddPost={onAddPost} refetchComments={refetchComments} />
                                    }


                                </div>
                                <Reply commentId={comment.id} lastUpdatedReply={lastUpdatedReply} onAddPost={onAddPost} user={user} />
                            </React.Fragment>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center p-4">No comments yet.</p>
                    )
                ) : null}
            </div>
            {
                commentIdToDelete && (
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
                )
            }
        </div >)
}

export default Comment;