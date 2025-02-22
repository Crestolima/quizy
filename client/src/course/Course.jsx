import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Grid, 
  Typography, 
  CircularProgress, 
  Button, 
  Modal, 
  Box, 
  TextField, 
  Card, 
  CardContent, 
  CardActions, 
  CardMedia, 
  Container,
  Pagination
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../AuthContext';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const styles = `
@keyframes disintegrate {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(100px);
  }
}

.disintegrate {
  animation: disintegrate 0.5s forwards;
}
`;

const Course = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    name: '',
    description: '',
    duration: '',
    instructor: '',
    image: null
  });
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0
  });
  const { loggedInUser } = useAuth();
  const limit = 6; // Number of courses per page

  const fetchCourses = async (page = 1) => {
    try {
      const response = await axios.get(`http://localhost:3001/courses?page=${page}&limit=${limit}`);
      setCourses(response.data.courses);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalCourses: response.data.totalCourses
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
      setLoading(false);
      toast.error('Failed to fetch courses');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handlePageChange = (event, value) => {
    fetchCourses(value);
  };

  const handleOpenModal = () => {
    setNewCourseData({
      ...newCourseData,
      instructor: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewCourseData({
      name: '',
      description: '',
      duration: '',
      instructor: '',
      image: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewCourseData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleCreateCourse = async () => {
    if (!loggedInUser) {
      toast.error('You need to be logged in to create a course');
      return;
    }

    if (!newCourseData.name || !newCourseData.description || !newCourseData.duration || !newCourseData.image) {
      toast.error('Please fill in all fields and upload an image');
      return;
    }

    const formData = new FormData();
    formData.append('name', newCourseData.name);
    formData.append('description', newCourseData.description);
    formData.append('duration', newCourseData.duration);
    formData.append('instructor', newCourseData.instructor);
    formData.append('image', newCourseData.image);

    try {
      await axios.post('http://localhost:3001/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      handleCloseModal();
      fetchCourses(pagination.currentPage);
      toast.success('Course created successfully');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleDeleteCourse = async (id) => {
    setDeletingCourseId(id);
    setTimeout(async () => {
      try {
        await axios.delete(`http://localhost:3001/courses/${id}`);
        await fetchCourses(pagination.currentPage);
        toast.success('Course deleted successfully');
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error('Failed to delete course');
      } finally {
        setDeletingCourseId(null);
      }
    }, 500);
  };

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  const particlesOptions = {
    particles: {
      number: { value: 50, density: { enable: true, value_area: 800 } },
      color: { value: "#000000" },
      shape: {
        type: "circle",
        stroke: { width: 0, color: "#000000" }
      },
      opacity: {
        value: 0.5,
        random: false,
        anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false }
      },
      size: {
        value: 3,
        random: true,
        anim: { enable: false, speed: 40, size_min: 0.1, sync: false }
      },
      line_linked: { enable: false },
      move: {
        enable: true,
        speed: 6,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: false },
        onclick: { enable: false },
        resize: true
      }
    },
    retina_detect: true
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <style>{styles}</style>
      <ToastContainer />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Courses</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenModal}
          sx={{ borderRadius: 2 }}
        >
          Add New Course
        </Button>
      </Box>

      <Grid container spacing={3}>
        {courses.map(course => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card
              className={deletingCourseId === course._id ? 'disintegrate' : ''}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                position: 'relative'
              }}
            >
              {deletingCourseId === course._id && (
                <Particles
                  id={`particles-${course._id}`}
                  init={particlesInit}
                  options={particlesOptions}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {course.imageUrl && (
                <CardMedia
                  component="img"
                  height="140"
                  image={course.imageUrl}
                  alt={course.name}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>{course.name}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {course.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {course.duration}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Instructor: {course.instructor}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => handleDeleteCourse(course._id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
            Add New Course
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            name="name"
            label="Course Name"
            value={newCourseData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            name="description"
            label="Description"
            value={newCourseData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            name="duration"
            label="Duration"
            value={newCourseData.duration}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            name="instructor"
            label="Publisher"
            value={newCourseData.instructor}
            disabled
          />
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*"
              type="file"
              onChange={handleFileChange}
              style={{ marginBottom: '16px' }}
            />
          </Box>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreateCourse}
            sx={{ mt: 2 }}
          >
            Create Course
          </Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default Course;