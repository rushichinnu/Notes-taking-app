// import { Response } from "express";
// import { AuthRequest } from "../middleware/auth";
// import Note from "../models/Note";
// import Joi from "joi";

// const noteSchema = Joi.object({
//   title: Joi.string().min(1).max(200).required(),
//   content: Joi.string().min(1).max(5000).required(),
// });

// export const getNotes = async (req: AuthRequest, res: Response) => {
//   try {
//     const notes = await Note.find({ userId: req.user._id })
//       .sort({ createdAt: -1 })
//       .select("title content createdAt updatedAt");

//     // Transform _id to id for frontend consistency
//     const transformedNotes = notes.map((note) => ({
//       id: note._id.toString(),
//       title: note.title,
//       content: note.content,
//       createdAt: note.createdAt,
//       updatedAt: note.updatedAt,
//     }));

//     res.json({ notes: transformedNotes });
//   } catch (error) {
//     console.error("Get notes error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const createNote = async (req: AuthRequest, res: Response) => {
//   try {
//     const { error } = noteSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ message: error.details[0].message });
//     }

//     const { title, content } = req.body;

//     const note = new Note({
//       title,
//       content,
//       userId: req.user._id,
//     });

//     await note.save();

//     res.status(201).json({
//       message: "Note created successfully",
//       note: {
//         id: note._id.toString(), // Convert _id to id
//         title: note.title,
//         content: note.content,
//         createdAt: note.createdAt,
//         updatedAt: note.updatedAt,
//       },
//     });
//   } catch (error) {
//     console.error("Create note error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const updateNote = async (req: AuthRequest, res: Response) => {
//   try {
//     const { error } = noteSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ message: error.details[0].message });
//     }

//     const { id } = req.params;
//     const { title, content } = req.body;

//     const note = await Note.findOne({ _id: id, userId: req.user._id });
//     if (!note) {
//       console.log("❌ Note not found for ID:", id);
//       return res.status(404).json({ message: "Note not found" });
//     }

//     note.title = title;
//     note.content = content;
//     await note.save();

//     res.json({
//       message: "Note updated successfully",
//       note: {
//         id: note._id.toString(), // Convert _id to id
//         title: note.title,
//         content: note.content,
//         createdAt: note.createdAt,
//         updatedAt: note.updatedAt,
//       },
//     });
//   } catch (error) {
//     console.error("Update note error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const deleteNote = async (req: AuthRequest, res: Response) => {
//   try {
//     const { id } = req.params;

//     const note = await Note.findOne({ _id: id, userId: req.user._id });
//     if (!note) {
//       return res.status(404).json({ message: "Note not found" });
//     }

//     await Note.findByIdAndDelete(id);

//     res.json({ message: "Note deleted successfully" });
//   } catch (error) {
//     console.error("Delete note error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";

import Note, { INote } from "../models/Note";
import Joi from "joi";

const noteSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(5000).required(),
});

export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    const transformed = notes.map((note) => ({
      id: (note._id as mongoose.Types.ObjectId).toString(),
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));

    return res.json({ notes: transformed });
  } catch (err) {
    console.error("Get notes error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = noteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { title, content } = req.body;

    const note = new Note({
      title,
      content,
      userId: req.user._id,
    });

    const savedNote = await note.save();

    return res.status(201).json({
      message: "Note created successfully",
      note: {
        id: (savedNote._id as mongoose.Types.ObjectId).toString(),
        title: savedNote.title,
        content: savedNote.content,
        createdAt: savedNote.createdAt,
        updatedAt: savedNote.updatedAt,
      },
    });
  } catch (err) {
    console.error("Create note error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = noteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findOne({ _id: id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.title = title;
    note.content = content;

    const savedNote = await note.save();

    return res.json({
      message: "Note updated successfully",
      note: {
        id: (savedNote._id as mongoose.Types.ObjectId).toString(),
        title: savedNote.title,
        content: savedNote.content,
        createdAt: savedNote.createdAt,
        updatedAt: savedNote.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update note error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    await Note.findByIdAndDelete(id);

    return res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete note error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
