import React, { useState, useEffect } from 'react';
import {
    Container,
    TextField,
    Button,
    Typography,
    Grid,
    MenuItem,
    Box,
    Switch,
    FormControl,
    FormGroup,
    FormLabel,
    FormControlLabel,
    Paper,
    Checkbox,
    CircularProgress,
    Alert
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MCQForm() {
    // State management
    const [course, setCourse] = useState('');
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctOptions, setCorrectOptions] = useState([]);
    const [isMultipleAnswer, setIsMultipleAnswer] = useState(false);
    const [courses, setCourses] = useState([]);
    const [mcqs, setMcqs] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [mcqId, setMcqId] = useState('');
    const [showMCQs, setShowMCQs] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchMCQs();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:3001/courses');
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to load courses');
            setCourses([]);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchMCQs = async () => {
        try {
            const response = await fetch('http://localhost:3001/mcqs/grouped');
            if (!response.ok) {
                throw new Error('Failed to fetch MCQs');
            }
            const data = await response.json();
            setMcqs(data || []);
        } catch (error) {
            console.error('Error fetching MCQs:', error);
            toast.error('Failed to load MCQs');
            setMcqs([]);
        }
    };

    const fetchMCQDetails = async (id) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3001/mcqs/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch MCQ details');
            }
            const data = await response.json();
            setCourse(data.course);
            setQuestion(data.question);
            setOptions(data.options);
            setCorrectOptions(data.correctOptions || []);
            setIsMultipleAnswer(data.isMultipleAnswer || false);
            setMcqId(data._id);
            setEditMode(true);
        } catch (error) {
            console.error('Error fetching MCQ details:', error);
            toast.error('Failed to load MCQ details');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCorrectOptionChange = (index) => {
        const newCorrectOptions = [...correctOptions];
        if (newCorrectOptions.includes(index)) {
            setCorrectOptions(newCorrectOptions.filter((i) => i !== index));
        } else {
            if (isMultipleAnswer) {
                newCorrectOptions.push(index);
            } else {
                newCorrectOptions.splice(0, newCorrectOptions.length, index);
            }
            setCorrectOptions(newCorrectOptions);
        }
    };

    const validateForm = () => {
        if (!course) {
            toast.error('Please select a course');
            return false;
        }
        if (!question.trim()) {
            toast.error('Please enter a question');
            return false;
        }
        if (options.some(option => !option.trim())) {
            toast.error('Please fill in all options');
            return false;
        }
        if (correctOptions.length === 0) {
            toast.error('Please select at least one correct option');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData = {
            course,
            question,
            options,
            correctOptions,
            isMultipleAnswer
        };

        const url = editMode ? `http://localhost:3001/mcqs/${mcqId}` : 'http://localhost:3001/mcqs';
        const method = editMode ? 'PUT' : 'POST';

        try {
            setSubmitting(true);
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit MCQ');
            }

            await response.json();
            resetForm();
            toast.success(`MCQ ${editMode ? 'updated' : 'created'} successfully`);
            fetchMCQs();
        } catch (error) {
            console.error('Error submitting MCQ:', error);
            toast.error(`Failed to ${editMode ? 'update' : 'create'} MCQ`);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setCourse('');
        setQuestion('');
        setOptions(['', '', '', '']);
        setCorrectOptions([]);
        setIsMultipleAnswer(false);
        setEditMode(false);
        setMcqId('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this MCQ?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/mcqs/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete MCQ');
            }

            toast.success('MCQ deleted successfully');
            fetchMCQs();
        } catch (error) {
            console.error('Error deleting MCQ:', error);
            toast.error('Failed to delete MCQ');
        }
    };

    const renderMCQs = () => {
        if (mcqs.length === 0) {
            return (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No MCQs found. Create your first MCQ!
                </Alert>
            );
        }

        return mcqs.map((group) => (
            <Box key={group._id} mb={4}>
                <Typography variant="h6">{group.courseDetails[0]?.name}</Typography>
                {group.mcqs.map((mcq) => (
                    <Paper key={mcq._id} sx={{ mt: 2, mb: 2, p: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            {mcq.question}
                        </Typography>
                        <Grid container spacing={2}>
                            {mcq.options.map((option, index) => (
                                <Grid item xs={12} sm={6} key={index}>
                                    <Typography
                                        variant="body2"
                                        color={mcq.correctOptions.includes(index) ? "success.main" : "text.primary"}
                                    >
                                        {index + 1}. {option}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => fetchMCQDetails(mcq._id)}
                                sx={{ mr: 1 }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => handleDelete(mcq._id)}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Paper>
                ))}
            </Box>
        ));
    };

    if (loading && !showMCQs) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4">{editMode ? 'Edit MCQ' : 'Create MCQ'}</Typography>
                <FormControlLabel
                    control={<Switch checked={showMCQs} onChange={() => setShowMCQs(!showMCQs)} />}
                    label="Show MCQs"
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {showMCQs ? (
                <Paper elevation={3} sx={{ padding: 2 }}>
                    {renderMCQs()}
                </Paper>
            ) : (
                <Paper elevation={3} sx={{ padding: 2 }}>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            select
                            label="Course"
                            fullWidth
                            margin="normal"
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            disabled={loading || submitting}
                            error={!course && error}
                        >
                            {courses.map((course) => (
                                <MenuItem key={course._id} value={course._id}>
                                    {course.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Question"
                            fullWidth
                            margin="normal"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={submitting}
                            error={!question.trim() && error}
                        />

                        <Grid container spacing={2}>
                            {options.map((option, index) => (
                                <Grid item xs={12} sm={6} key={index}>
                                    <TextField
                                        label={`Option ${index + 1}`}
                                        fullWidth
                                        margin="normal"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        disabled={submitting}
                                        error={!option.trim() && error}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isMultipleAnswer}
                                    onChange={(e) => setIsMultipleAnswer(e.target.checked)}
                                    disabled={submitting}
                                />
                            }
                            label="Multiple Correct Answers"
                        />

                        <FormControl component="fieldset" margin="normal" error={correctOptions.length === 0 && error}>
                            <FormLabel component="legend">Correct Options</FormLabel>
                            <FormGroup row>
                                {options.map((option, index) => (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={correctOptions.includes(index)}
                                                onChange={() => handleCorrectOptionChange(index)}
                                                name={`option${index}`}
                                                disabled={submitting}
                                            />
                                        }
                                        label={`Option ${index + 1}`}
                                        key={index}
                                    />
                                ))}
                            </FormGroup>
                        </FormControl>

                        <Box mt={2}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    editMode ? 'Update MCQ' : 'Create MCQ'
                                )}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            )}
            <ToastContainer position="bottom-right" />
        </Container>
    );
}

export default MCQForm;