import { Router } from "express";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/notesController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getNotes);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
