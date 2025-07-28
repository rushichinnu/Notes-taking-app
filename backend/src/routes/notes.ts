import { Router } from "express";
import {
  getNotes,
  createNote,
  deleteNote,
} from "../controllers/notesController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getNotes);
router.post("/", createNote);
router.delete("/:id", deleteNote);

export default router;
