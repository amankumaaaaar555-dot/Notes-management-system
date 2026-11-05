
const express = require("express");
const mongoose = require("mongoose");
const { noteModel } = require("../model/note.model");

const noteRouter = express.Router();

// CREATE NOTE
noteRouter.post("/create", async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description) {
            return res.status(400).send({
                msg: "Title and description are required"
            });
        }

        const note = await noteModel.create({
            title,
            description,
            category: category || "Study",
            userId: req.userId
        });

        return res.status(201).send({
            msg: "Note created successfully",
            note
        });
    } catch (error) {
        console.error("Create note error:", error);
        return res.status(500).send({ msg: "Something went wrong" });
    }
});

// GET ALL NOTES
noteRouter.get("/all", async (req, res) => {
    try {
        const notes = await noteModel.find({
            userId: req.userId
        }).sort({ createdAt: -1 });

        return res.status(200).send({
            msg: "Notes fetched successfully",
            totalNotes: notes.length,
            notes
        });
    } catch (error) {
        console.error("Fetch notes error:", error);
        return res.status(500).send({ msg: "Something went wrong" });
    }
});

// UPDATE NOTE
noteRouter.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ msg: "Invalid note ID" });
        }

        const { title, description, category } = req.body;

        const note = await noteModel.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { title, description, category },
            { new: true, runValidators: true }
        );

        if (!note) {
            return res.status(404).send({ msg: "Note not found" });
        }

        return res.status(200).send({
            msg: "Note updated successfully",
            note
        });
    } catch (error) {
        console.error("Update note error:", error);
        return res.status(500).send({ msg: "Something went wrong" });
    }
});

// PIN / UNPIN NOTE
noteRouter.patch("/pin/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ msg: "Invalid note ID" });
        }

        const note = await noteModel.findOne({
            _id: id,
            userId: req.userId
        });

        if (!note) {
            return res.status(404).send({ msg: "Note not found" });
        }

        note.pinned = !note.pinned;
        await note.save();

        return res.status(200).send({
            msg: note.pinned ? "Note pinned successfully" : "Note unpinned successfully",
            note
        });
    } catch (error) {
        console.error("Pin note error:", error);
        return res.status(500).send({ msg: "Something went wrong" });
    }
});

// DELETE NOTE
noteRouter.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ msg: "Invalid note ID" });
        }

        const note = await noteModel.findOneAndDelete({
            _id: id,
            userId: req.userId
        });

        if (!note) {
            return res.status(404).send({ msg: "Note not found" });
        }

        return res.status(200).send({
            msg: "Note deleted successfully",
            note
        });
    } catch (error) {
        console.error("Delete note error:", error);
        return res.status(500).send({ msg: "Something went wrong" });
    }
});

module.exports = { noteRouter };
