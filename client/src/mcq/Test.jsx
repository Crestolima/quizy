import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../AuthContext';

const Root = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

const Loading = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
});

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const OptionButton = styled(Button)(({ theme, selected }) => ({
  width: '100%',
  textAlign: 'left',
  justifyContent: 'flex-start',
  marginBottom: theme.spacing(1),
  backgroundColor: selected ? theme.palette.primary.main : theme.palette.background.paper,
  color: selected ? theme.palette.common.white : theme.palette.text.primary,
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : theme.palette.action.hover,
  },
}));

const Test = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [mcqs, setMcqs] = useState([]);
  const [numQuestions, setNumQuestions] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const { loggedInUser } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:3001/courses');
        // Extract courses array from the response
        setCourses(response.data.courses || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to fetch courses');
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const fetchMCQs = async () => {
        try {
          const response = await axios.get(`http://localhost:3001/mcqs/course/${selectedCourse}`);
          if (Array.isArray(response.data)) {
            setMcqs(response.data);
          } else {
            setMcqs([]);
            toast.error('No MCQs available for this course');
          }
        } catch (error) {
          console.error('Error fetching MCQs:', error);
          toast.error('Failed to fetch MCQs');
          setMcqs([]);
        }
      };

      fetchMCQs();
    }
  }, [selectedCourse]);

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setShowResults(false);
    setScore(null);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setNumQuestions('');
  };

  const handleNumQuestionsChange = (event) => {
    const value = event.target.value;
    const maxQuestions = mcqs.length;
    if (value <= maxQuestions) {
      setNumQuestions(value);
    } else {
      setNumQuestions(maxQuestions);
      toast.info(`Maximum available questions: ${maxQuestions}`);
    }
  };

  const handleAnswerChange = (optionIndex) => {
    const currentAnswers = answers[currentQuestionIndex] || [];
    const isMultipleAnswer = mcqs[currentQuestionIndex]?.isMultipleAnswer;

    if (isMultipleAnswer) {
      if (currentAnswers.includes(optionIndex)) {
        setAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[currentQuestionIndex] = newAnswers[currentQuestionIndex].filter(idx => idx !== optionIndex);
          return newAnswers;
        });
      } else {
        setAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[currentQuestionIndex] = [...(newAnswers[currentQuestionIndex] || []), optionIndex];
          return newAnswers;
        });
      }
    } else {
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = [optionIndex];
        return newAnswers;
      });
    }
  };

  const handleSubmit = async () => {
    if (!loggedInUser) {
      toast.error('You need to be logged in to submit the test');
      return;
    }

    const selectedMCQs = mcqs.slice(0, parseInt(numQuestions, 10));
    let newScore = 0;

    selectedMCQs.forEach((mcq, index) => {
      const userAnswers = answers[index] || [];
      const correctAnswers = mcq.correctOptions;

      if (mcq.isMultipleAnswer) {
        if (userAnswers.sort().toString() === correctAnswers.sort().toString()) {
          newScore++;
        }
      } else {
        if (correctAnswers.includes(userAnswers[0])) {
          newScore++;
        }
      }
    });

    setScore(newScore);
    setShowResults(true);

    const testData = {
      user: loggedInUser._id, // Send user ID instead of name
      course: selectedCourse,
      score: newScore,
      totalQuestions: parseInt(numQuestions, 10),
    };

    try {
      await axios.post('http://localhost:3001/tests', testData);
      toast.success('Test submitted successfully');
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test');
    }
  };

  if (loading) {
    return (
      <Loading>
        <CircularProgress />
      </Loading>
    );
  }

  return (
    <Root>
      <ToastContainer />
      <Typography variant="h4" gutterBottom>Take a Test</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Course</InputLabel>
            <Select value={selectedCourse} onChange={handleCourseChange}>
              {courses.map(course => (
                <MenuItem key={course._id} value={course._id}>{course.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {selectedCourse && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <TextField
                label="Number of Questions"
                type="number"
                value={numQuestions}
                onChange={handleNumQuestionsChange}
                inputProps={{ min: 1, max: mcqs.length }}
              />
            </FormControl>
          </Grid>
        )}
      </Grid>
      {selectedCourse && numQuestions && currentQuestionIndex < numQuestions && mcqs.length > 0 && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6">
              Question {currentQuestionIndex + 1}
            </Typography>
            <Typography>{mcqs[currentQuestionIndex]?.question}</Typography>
            <FormGroup>
              {mcqs[currentQuestionIndex]?.options.map((option, index) => (
                <OptionButton
                  key={index}
                  selected={(answers[currentQuestionIndex] || []).includes(index)}
                  onClick={() => handleAnswerChange(index)}
                  variant="outlined"
                >
                  <Checkbox
                    checked={(answers[currentQuestionIndex] || []).includes(index)}
                    onChange={() => handleAnswerChange(index)}
                    color="primary"
                  />
                  {option}
                </OptionButton>
              ))}
            </FormGroup>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              {currentQuestionIndex < numQuestions - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
              )}
            </Box>
          </CardContent>
        </StyledCard>
      )}
      {showResults && (
        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="h5">Test Results</Typography>
          <Typography variant="body1">
            You scored {score} out of {numQuestions}
          </Typography>
        </Alert>
      )}
    </Root>
  );
};

export default Test;