
import { useEffect, useMemo, useState } from "react";
import {
    BrowserRouter, Routes, Route, Navigate, useNavigate
} from "react-router-dom";
import API from "./services/api";
import "./App.css";

const NOTE_COLORS = [
    { name: "Purple", value: "#f0ebff" },
    { name: "Blue", value: "#e8f3ff" },
    { name: "Green", value: "#e8f8ef" },
    { name: "Yellow", value: "#fff6dc" },
    { name: "Pink", value: "#ffeaf1" }
];

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const login = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/user/login", { email, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.msg || "Login failed");
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={login}>
                <div className="brand-mark">N</div>
                <h1>Welcome back</h1>
                <p className="auth-subtitle">Sign in to your personal workspace.</p>
                {error && <div className="error">{error}</div>}
                <label>Email address</label>
                <input type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                <label>Password</label>
                <input type="password" placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                <button className="primary-btn full-btn">Sign in</button>
                <p className="auth-switch">
                    Don't have an account? <span onClick={() => navigate("/register")}>Create one</span>
                </p>
            </form>
        </div>
    );
}

function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");

    const register = async (e) => {
        e.preventDefault();
        try {
            await API.post("/user/register", form);
            alert("Account created successfully. Please sign in.");
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.msg || "Registration failed");
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={register}>
                <div className="brand-mark">N</div>
                <h1>Create your account</h1>
                <p className="auth-subtitle">Your thoughts deserve a better space.</p>
                {error && <div className="error">{error}</div>}
                <label>Full name</label>
                <input placeholder="Your name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                <label>Email address</label>
                <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                <label>Password</label>
                <input type="password" placeholder="At least 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    minLength="6" required />
                <button className="primary-btn full-btn">Create account</button>
                <p className="auth-switch">
                    Already have an account? <span onClick={() => navigate("/")}>Sign in</span>
                </p>
            </form>
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Study");
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [editId, setEditId] = useState(null);
    const [message, setMessage] = useState("");
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("notesTheme") === "dark"
    );

    const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].value);
    const [noteColors, setNoteColors] = useState(
        () => JSON.parse(localStorage.getItem("noteColors") || "{}")
    );

    const categories = ["All", "Study", "Personal", "Work", "Projects", "Other"];

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/");
            return;
        }
        loadNotes();
    }, []);

    useEffect(() => {
        document.body.classList.toggle("dark-theme", darkMode);
        localStorage.setItem("notesTheme", darkMode ? "dark" : "light");
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("noteColors", JSON.stringify(noteColors));
    }, [noteColors]);

    const loadNotes = async () => {
        try {
            const res = await API.get("/notes/all");
            setNotes(res.data.notes || []);
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
        }
    };

    const saveNote = async (e) => {
        e.preventDefault();

        try {
            const noteData = { title, description, category };
            let savedId = editId;

            if (editId) {
                await API.put(`/notes/${editId}`, noteData);
                setMessage("Note updated successfully!");
            } else {
                const res = await API.post("/notes/create", noteData);
                savedId = res.data.note?._id;
                setMessage("Note created successfully!");
            }

            if (savedId) {
                setNoteColors(prev => ({
                    ...prev,
                    [savedId]: selectedColor
                }));
            }

            setTitle("");
            setDescription("");
            setCategory("Study");
            setSelectedColor(NOTE_COLORS[0].value);
            setEditId(null);
            await loadNotes();
        } catch (err) {
            setMessage(err.response?.data?.msg || "Unable to save note");
        }
    };

    const startEdit = (note) => {
        setEditId(note._id);
        setTitle(note.title);
        setDescription(note.description);
        setCategory(note.category || "Personal");
        setSelectedColor(noteColors[note._id] || NOTE_COLORS[0].value);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditId(null);
        setTitle("");
        setDescription("");
        setCategory("Study");
        setSelectedColor(NOTE_COLORS[0].value);
        setMessage("");
    };

    const togglePin = async (note) => {
        try {
            await API.patch(`/notes/pin/${note._id}`);
            setMessage(note.pinned ? "Note unpinned!" : "Note pinned!");
            await loadNotes();
        } catch (err) {
            setMessage(err.response?.data?.msg || "Unable to update pin status");
        }
    };

    const deleteNote = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        try {
            await API.delete(`/notes/${id}`);
            setMessage("Note deleted successfully!");
            setNoteColors(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
            await loadNotes();
        } catch {
            setMessage("Unable to delete note");
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            const matchesSearch =
                (note.title || "").toLowerCase().includes(search.toLowerCase()) ||
                (note.description || "").toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                activeCategory === "All" ||
                (activeCategory === "Pinned" ? note.pinned : note.category === activeCategory);

            return matchesSearch && matchesCategory;
        });
    }, [notes, search, activeCategory]);

    const pinnedCount = notes.filter(note => note.pinned).length;
    const todayCount = notes.filter(note =>
        new Date(note.createdAt).toDateString() === new Date().toDateString()
    ).length;

    const wordCount = description.trim()
        ? description.trim().split(/\s+/).length
        : 0;

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-mark small-mark">N</div>
                    <span>NoteSpace</span>
                </div>

                <p className="side-label">WORKSPACE</p>

                <button
                    className={`side-link ${activeCategory === "All" ? "active" : ""}`}
                    onClick={() => setActiveCategory("All")}>
                    <span>▦</span> All Notes
                    <span className="side-count">{notes.length}</span>
                </button>

                <button
                    className={`side-link ${activeCategory === "Pinned" ? "active" : ""}`}
                    onClick={() => setActiveCategory("Pinned")}>
                    <span>★</span> Pinned Notes
                    <span className="side-count">{pinnedCount}</span>
                </button>

                <p className="side-label category-label">CATEGORIES</p>

                {categories.slice(1).map(cat => (
                    <button key={cat}
                        className={`side-link ${activeCategory === cat ? "active" : ""}`}
                        onClick={() => setActiveCategory(cat)}>
                        <span className={`category-dot ${cat.toLowerCase()}`}></span>
                        {cat}
                    </button>
                ))}

                <div className="sidebar-bottom">
                    <div className="user-avatar">
                        {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <strong>{user.name || "User"}</strong>
                        <span>Personal workspace</span>
                    </div>
                    <button className="logout-icon" onClick={logout} title="Logout">↗</button>
                </div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <div>
                        <span className="breadcrumb">Workspace / Notes</span>
                        <h2>My Workspace</h2>
                    </div>
                    <div className="topbar-actions">
                        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
                            {darkMode ? "☀ Light mode" : "☾ Dark mode"}
                        </button>
                        <button className="primary-btn" onClick={() => {
                            cancelEdit();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}>
                            + New note
                        </button>
                    </div>
                </header>

                <section className="welcome-section">
                    <div>
                        <span className="welcome-tag">YOUR PERSONAL SPACE</span>
                        <h1>Good to see you, {user.name || "there"}! 👋</h1>
                        <p>Capture ideas, organize thoughts and stay productive.</p>
                    </div>
                    <div className="welcome-icon">✦</div>
                </section>

                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon purple-icon">▤</div>
                        <div><span>Total notes</span><h2>{notes.length}</h2></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow-icon">★</div>
                        <div><span>Pinned notes</span><h2>{pinnedCount}</h2></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green-icon">✦</div>
                        <div><span>Created today</span><h2>{todayCount}</h2></div>
                    </div>
                </section>

                <section className="editor-card" id="note-editor">
                    <div className="section-heading">
                        <div>
                            <h2>{editId ? "Edit your note" : "Create something new"}</h2>
                            <p>{editId ? "Update your existing note." : "Write down what's on your mind."}</p>
                        </div>
                        <span className="editor-symbol">✎</span>
                    </div>

                    <form onSubmit={saveNote}>
                        <input className="title-input"
                            placeholder="Give your note a title..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required />

                        <textarea className="description-input"
                            placeholder="Start writing your thoughts here..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required />

                        <div className="color-picker-area">
                            <strong>Note color</strong>
                            <div className="color-options">
                                {NOTE_COLORS.map(color => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        title={color.name}
                                        aria-label={`${color.name} note color`}
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`color-swatch ${selectedColor === color.value ? "color-selected" : ""}`}
                                        style={{ backgroundColor: color.value }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="editor-footer">
                            <div className="editor-meta">
                                <select value={category} onChange={e => setCategory(e.target.value)}>
                                    {categories.slice(1).map(cat =>
                                        <option key={cat} value={cat}>{cat}</option>
                                    )}
                                </select>
                                <span>{wordCount} words</span>
                            </div>

                            <div className="form-buttons">
                                {editId && <button type="button" className="cancel-btn"
                                    onClick={cancelEdit}>Cancel</button>}
                                <button className="primary-btn" type="submit">
                                    {editId ? "Save changes" : "Save note"}
                                </button>
                            </div>
                        </div>
                    </form>

                    {message && <p className="status-message">{message}</p>}
                </section>

                <section className="notes-section">
                    <div className="notes-toolbar">
                        <div>
                            <h2>
                                {activeCategory === "Pinned" ? "Pinned Notes" :
                                    activeCategory === "All" ? "Your Notes" : activeCategory + " Notes"}
                            </h2>
                            <p>{filteredNotes.length} notes found</p>
                        </div>
                        <div className="search-box">
                            <span>⌕</span>
                            <input placeholder="Search your notes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="filter-tabs">
                        {categories.map(cat => (
                            <button key={cat}
                                className={activeCategory === cat ? "selected-tab" : ""}
                                onClick={() => setActiveCategory(cat)}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="notes-grid">
                        {filteredNotes.map(note => (
                            <article
                                className={`note-card note-${(note.category || "Personal").toLowerCase()}`}
                                key={note._id}
                                style={{
                                    backgroundColor: noteColors[note._id] || undefined,
                                    borderTop: `4px solid ${noteColors[note._id] || "#ded8ff"}`
                                }}>
                                <div className="note-card-top">
                                    <span className={`note-category category-${(note.category || "Personal").toLowerCase()}`}>
                                        {note.category || "Personal"}
                                    </span>
                                    <button
                                        className={`pin-btn ${note.pinned ? "is-pinned" : ""}`}
                                        onClick={() => togglePin(note)}
                                        title={note.pinned ? "Unpin note" : "Pin note"}>
                                        {note.pinned ? "★" : "☆"}
                                    </button>
                                </div>

                                <h3>{note.title}</h3>
                                <p className="note-description">{note.description}</p>

                                <div className="note-card-bottom">
                                    <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                                    <div>
                                        <button onClick={() => startEdit(note)}>Edit</button>
                                        <button className="delete-action"
                                            onClick={() => deleteNote(note._id)}>Delete</button>
                                    </div>
                                </div>
                            </article>
                        ))}

                        {filteredNotes.length === 0 && (
                            <div className="empty-state">
                                <div>✎</div>
                                <h3>No notes found</h3>
                                <p>Try another search or create a new note.</p>
                            </div>
                        )}
                    </div>
                </section>

                <footer className="app-footer">
                    Made with care · NoteSpace
                </footer>
            </main>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
