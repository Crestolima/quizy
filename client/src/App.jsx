import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './signup';
import Login from './Login';
import Dashboard from './dashboard/Dashboard';
import Course from './course/Course';
import MCQForm from './mcq/mcq';
import PrivateRoute from './PrivateRoute';
import Flashcards from './mcq/Flashcards';
import Test from './mcq/Test';
import Home from './Homepage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protect the home and nested routes */}
      <Route path="/home" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
        <Route path="" element={<Home />} /> {/* Default page route */}
        <Route path="course" element={<Course />} />
        <Route path="mcq" element={<MCQForm />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="test" element={<Test />} />
        {/* Add other routes here */}
      </Route>
      
    </Routes>
  );
}

export default App;
