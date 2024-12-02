import React, { useState } from 'react';

const EditDeleteModal = ({ isOpen, onClose, onEdit, onDelete, itemId, itemType, handleConfirmDelete, postIdToDelete, handleCloseModal }) => {

    return (
        <>
            {isOpen && (
                <div className="absolute z-50 bg-white rounded shadow-lg p-4 top-16 right-0" style={{ transform: 'translateY(-100%)' }}>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-2">
                            <span className="mr-2">•</span>
                            <button onClick={onEdit} className="hover:bg-gray-200 rounded px-1">Edit {itemType}</button>
                        </div>
                        <div className="flex items-center mb-2">
                            <span className="mr-2">•</span>
                            <button onClick={onDelete} className="hover:bg-gray-200 rounded px-1">Delete {itemType}</button>
                        </div>
                        <div className="flex items-center">
                            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-600 font-medium py-1 px-2 rounded">
                                Close X
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                </svg>
                            </button>
                        </div>
                    </div>

                    {postIdToDelete === itemId && (
                        <div>
                            <p>Are you sure you want to delete this {itemType}?</p>
                            <button onClick={handleConfirmDelete}>Confirm</button>
                            <button onClick={handleCloseModal}>Cancel</button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default EditDeleteModal;