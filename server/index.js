const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const connectDB = require("./config/db");
const cloudinary = require('./config/cloudinary');
require('dotenv').config();

// Import Mongoose models
const UserModel = require('./models/user');
const CourseModel = require('./models/course');
const MCQModel = require('./models/MCQModel');
const TestModel = require('./models/test');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Connect to MongoDB database
connectDB();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Input validation middleware
const validateUserInput = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
};

// Base route
app.get('/', (req, res) => {
    res.send('Hello, Quizy Server!');
});

// User Routes
app.post('/login', validateUserInput, async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "No User Found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid Password" });
        }

        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            _id: user._id
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

app.post('/signup', validateUserInput, async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await UserModel.create({
            firstName,
            lastName,
            email,
            password: hash
        });

        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            _id: user._id
        });
    } catch (err) {
        res.status(500).json({ error: "Signup failed" });
    }
});

// Course Routes
app.post('/courses', upload.single('image'), async (req, res) => {
    const { name, description, duration, instructor } = req.body;

    if (!name || !description || !duration || !instructor) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (!req.file) {
        return res.status(400).json({ error: "Image is required" });
    }

    try {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, and GIF are allowed." });
        }

        const result = await cloudinary.uploader.upload(req.file.buffer.toString('base64'), {
            resource_type: "image",
            allowed_formats: ["jpg", "png", "gif"],
            max_bytes: 5000000
        });

        const newCourse = await CourseModel.create({
            name,
            description,
            duration,
            instructor,
            imageUrl: result.secure_url
        });

        res.json(newCourse);
    } catch (err) {
        res.status(500).json({ error: "Failed to create course" });
    }
});

app.get('/courses', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const courses = await CourseModel.find()
            .skip(skip)
            .limit(limit)
            .select('name description duration instructor imageUrl');
        
        const total = await CourseModel.countDocuments();

        res.json({
            courses,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCourses: total
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

app.get('/courses/recent', async (req, res) => {
    try {
        const recentCourses = await CourseModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name description duration instructor imageUrl');
        res.json(recentCourses);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch recent courses" });
    }
});

// Delete MCQ route
app.delete('/mcqs/:id', async (req, res) => {
    const { id } = req.params;
    try {
    const deletedMCQ = await MCQModel.findByIdAndDelete(id);
    if (deletedMCQ) {
    res.json({ message: "MCQ deleted successfully" });
    } else {
    res.status(404).json({ error: "MCQ not found" });
    }
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

// Update MCQ route
app.put('/mcqs/:id', async (req, res) => {
    const { id } = req.params;
    const { course, question, options, correctOptions, isMultipleAnswer } = req.body;
    
    // Validate correct options
    if (!Array.isArray(correctOptions) || correctOptions.length === 0) {
    return res.status(400).json({ error: "At least one correct option must be provided" });
    }
    
    try {
    const updatedMCQ = await MCQModel.findByIdAndUpdate(
    id,
    { course, question, options, correctOptions, isMultipleAnswer },
    { new: true }
    ).populate('course', 'name');
    if (!updatedMCQ) {
    return res.status(404).json({ error: "MCQ not found" });
    }
    res.json(updatedMCQ);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

// Get grouped MCQs
app.get('/mcqs/grouped', async (req, res) => {
    try {
    const groups = await MCQModel.aggregate([
    { $group: { _id: '$course', mcqs: { $push: '$$ROOT' } } },
    { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseDetails' } }
    ]);
    res.json(groups);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });
    

// MCQ Routes
// Create MCQ route
app.post('/mcqs', async (req, res) => {
    const { course, question, options, correctOptions, isMultipleAnswer } = req.body;
    
    // Validate correct options
    if (!Array.isArray(correctOptions) || correctOptions.length === 0) {
    return res.status(400).json({ error: "At least one correct option must be provided" });
    }
    
    try {
    const mcq = new MCQModel({
    course,
    question,
    options,
    correctOptions,
    isMultipleAnswer
    });
    const savedMCQ = await mcq.save();
    res.json(savedMCQ);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

// Get single MCQ route
app.get('/mcqs/:id', async (req, res) => {
    const { id } = req.params;
    try {
    const mcq = await MCQModel.findById(id).populate('course', 'name');
    res.json(mcq);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

// Get MCQs for a specific course
app.get('/mcqs/course/:courseId', async (req, res) => {
    const { courseId } = req.params;
    try {
    const mcqs = await MCQModel.find({ course: courseId }).populate('course', 'name');
    if (mcqs.length > 0) {
    res.json(mcqs);
    } else {
    res.status(404).json({ message: "No MCQs found for this course" });
    }
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

// Test Routes
app.post('/tests', async (req, res) => {
    const { user, course, score, totalQuestions } = req.body;

    if (!user || !course || score === undefined || totalQuestions === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const foundUser = await UserModel.findById(user);
        if (!foundUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const foundCourse = await CourseModel.findById(course);
        if (!foundCourse) {
            return res.status(404).json({ error: "Course not found" });
        }

        const newTest = await TestModel.create({
            user: foundUser._id,
            course: foundCourse._id,
            score,
            totalQuestions
        });

        res.json(newTest);
    } catch (err) {
        res.status(500).json({ error: "Failed to create test result" });
    }
});

// Get all tests route
app.get('/tests', async (req, res) => {
    try {
    const tests = await TestModel.find().populate('user').populate('course');
    res.json(tests);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

app.get('/tests/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const tests = await TestModel.find({ user: userId })
            .populate('course', 'name')
            .sort({ createdAt: -1 });

        if (tests.length === 0) {
            return res.status(404).json({ message: "No test results found" });
        }

        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch test results" });
    }
});

// Get aggregated test results
app.get('/tests/aggregated', async (req, res) => {
    try {
    const aggregatedResults = await TestModel.aggregate([
    {
    $group: {
    _id: "$course",
    averageScore: { $avg: "$score" },
    totalTests: { $sum: 1 }
    }
    },
    {
    $lookup: {
    from: "courses",
    localField: "_id",
    foreignField: "_id",
    as: "courseDetails"
    }
    }
    ]);
    res.json(aggregatedResults);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

// Get overall stats
app.get('/stats', async (req, res) => {
    try {
    const totalUsers = await UserModel.countDocuments();
    const totalCourses = await CourseModel.countDocuments();
    const totalMcqs = await MCQModel.countDocuments();
    const totalTests = await TestModel.countDocuments();
    const averageScore = await TestModel.aggregate([
    { $group: { _id: null, avgScore: { $avg: "$score" } } },
    { $project: { _id: 0, avgScore: 1 } }
    ]);
    
    res.json({
    totalUsers,
    totalCourses,
    totalMcqs,
    totalTests,
    averageScore: averageScore[0] ? averageScore[0].avgScore : 0
    });
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

// Leaderboard Route
// Get leaderboard
app.get('/leaderboard', async (req, res) => {
    try {
    const leaderboard = await TestModel.aggregate([
    { $group: { _id: { user: "$user", course: "$course" }, totalScore: { $sum: "$score" } } },
    { $sort: { totalScore: -1 } },
    { $limit: 10 },
    {
    $lookup: {
    from: "users",
    localField: "_id.user",
    foreignField: "_id",
    as: "userDetails"
    }
    },
    { $unwind: "$userDetails" },
    {
    $lookup: {
    from: "courses",
    localField: "_id.course",
    foreignField: "_id",
    as: "courseDetails"
    }
    },
    { $unwind: "$courseDetails" },
    {
    $project: {
    _id: 0,
    user: "$userDetails",
    course: "$courseDetails",
    totalScore: 1
    }
    }
    ]);
    
    res.json(leaderboard);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });
  
    

    

// Error handling middleware
app.use(errorHandler);

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});