import React, { useState, useEffect } from "react";
import { Plus, Trash2, LogOut, User, Edit3, Save, X, Eye } from "lucide-react";
import { notesAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Note } from "../types";
import toast from "react-hot-toast";

const Dashboard: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState({ title: "", content: "" });
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await notesAPI.getNotes();
      setNotes(response.data.notes);
    } catch (error: any) {
      toast.error("Failed to fetch notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    try {
      const response = await notesAPI.createNote(newNote);
      setNotes((prev) => [response.data.note, ...prev]);
      setNewNote({ title: "", content: "" });
      setShowCreateModal(false);
      toast.success("Note created successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create note");
    }
  };

  const handleViewNote = (note: Note) => {
    console.log("🔍 Opening note with ID:", note.id);
    setSelectedNote(note);
    setShowViewModal(true);
    setIsEditing(false);
  };

  const handleEditNote = () => {
    if (selectedNote) {
      setEditNote({
        title: selectedNote.title,
        content: selectedNote.content,
      });
      setIsEditing(true);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) {
      console.log("❌ No selected note");
      return;
    }

    if (!editNote.title.trim() || !editNote.content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    console.log("🔍 Saving note with ID:", selectedNote.id);

    setIsSaving(true);
    try {
      const response = await notesAPI.updateNote(selectedNote.id, editNote);

      // Update the note in the list
      setNotes((prev) =>
        prev.map((note) =>
          note.id === selectedNote.id ? response.data.note : note
        )
      );

      // Update the selected note
      setSelectedNote(response.data.note);
      setIsEditing(false);
      toast.success("Note updated successfully");
    } catch (error: any) {
      console.error("❌ Save note error:", error);
      toast.error(error.response?.data?.message || "Failed to update note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditNote({ title: "", content: "" });
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await notesAPI.deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));

      // Close modal if the deleted note was being viewed
      if (selectedNote && selectedNote.id === id) {
        setShowViewModal(false);
        setSelectedNote(null);
      }

      toast.success("Note deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete note");
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedNote(null);
    setIsEditing(false);
    setEditNote({ title: "", content: "" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span>{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Notes</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Note</span>
          </button>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                No notes yet. Create your first note!
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => handleViewNote(note)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <h3 className="font-semibold text-lg mb-2 text-gray-800 pr-8">
                  {note.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {note.content}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Note</h3>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter note title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Write your note here..."
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Create Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Note Modal - UPDATED SECTION */}
      {showViewModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header - UPDATED: Outer X only shows in view mode */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <Edit3 className="w-5 h-5 text-primary-600" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-600" />
                )}
                <h3 className="text-lg font-semibold">
                  {isEditing ? "Edit Note" : "View Note"}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEditNote}
                      className="flex items-center space-x-1 px-3 py-1 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    {/* Outer X - Only show in VIEW mode */}
                    <button
                      onClick={closeViewModal}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveNote}
                      disabled={isSaving}
                      className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? "Saving..." : "Save"}</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    {/* No outer X in EDIT mode - prevents confusion */}
                  </>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editNote.title}
                      onChange={(e) =>
                        setEditNote((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter note title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={editNote.content}
                      onChange={(e) =>
                        setEditNote((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Write your note here..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {selectedNote.title}
                    </h2>
                  </div>
                  <div>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {selectedNote.content}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-500">
                    <span>
                      Created:{" "}
                      {new Date(selectedNote.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      Updated:{" "}
                      {new Date(selectedNote.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
