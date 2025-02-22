import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Card, CardContent, Container, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import './Flashcards.css';

const Flashcards = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [mcqs, setMcqs] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:3001/courses')
      .then(response => {
        // Extract courses array from response
        setCourses(response.data.courses || []);
      })
      .catch(error => console.error('Error fetching courses:', error));
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      axios.get(`http://localhost:3001/mcqs/course/${selectedCourse}`)
        .then(response => {
          console.log(response.data); // Log the fetched MCQ data
          setMcqs(response.data);
          setCurrentQuestionIndex(0);
          setShowAnswer(false);
        })
        .catch(error => console.error('Error fetching MCQs:', error));
    }
  }, [selectedCourse]);

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % mcqs.length);
    setShowAnswer(false);
  };

  const handleCardClick = () => {
    setShowAnswer((prevShowAnswer) => !prevShowAnswer);
  };

  const getCorrectAnswers = () => {
    if (!mcqs.length || !mcqs[currentQuestionIndex]) {
      return "No answer available";
    }

    const correctIndexes = mcqs[currentQuestionIndex].correctOptions;
    console.log("Correct indexes: ", correctIndexes); // Debug log for correctOptions

    if (!correctIndexes || correctIndexes.length === 0) {
      return "No correct answer provided.";
    }

    if (Array.isArray(correctIndexes)) {
      return correctIndexes.map(index => mcqs[currentQuestionIndex].options[index]).join(', ');
    }

    return mcqs[currentQuestionIndex].options[correctIndexes];
  };

  return (
    <Container>
      <FormControl fullWidth margin="normal">
        <InputLabel>Course</InputLabel>
        <Select value={selectedCourse} onChange={handleCourseChange}>
          {courses.map(course => (
            <MenuItem key={course._id} value={course._id}>
              {course.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {mcqs.length > 0 && (
        <div className="flip-card" onClick={handleCardClick}>
          <div className={`flip-card-inner ${showAnswer ? 'flipped' : ''}`}>
            <div className="flip-card-front">
              <Card className="custom-card">
                <CardContent className="custom-card-content">
                  <Typography variant="h5" component="div" className="question-text">
                    {mcqs[currentQuestionIndex].question}
                  </Typography>
                  <div className="options-container">
                    {mcqs[currentQuestionIndex].options.map((option, index) => (
                      <Typography key={index} variant="body2" color="text.secondary" className="option-text">
                        {String.fromCharCode(65 + index)}. {option}
                      </Typography>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flip-card-back">
              <Card className="custom-card">
                <CardContent className="custom-card-content">
                  <Typography variant="h6" component="div" className="correct-answer">
                    <FontAwesomeIcon icon={faCheckCircle} /> Correct Answer: {getCorrectAnswers()}
                  </Typography>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {mcqs.length > 1 && (
        <Button variant="contained" color="primary" onClick={handleNextQuestion} style={{ marginTop: 20 }}>
          Next
        </Button>
      )}
    </Container>
  );
};

export default Flashcards;