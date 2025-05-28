import React, { useState } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Image,
  InputGroup,
  FormControl
} from 'react-bootstrap';
import { EyeFill, EyeSlashFill } from 'react-bootstrap-icons';
import { useLoginMutation, useSignUpMutation } from '../api/Contact';
import { useNavigate } from 'react-router-dom';

// onSuccess receives the FormData for immediate login/chat fetch
const SignupForm = ({ onSuccess }) => {
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
const navigate = useNavigate();
  const initialValues = {
    username: '',
    name: '',
    email: '',
    password: '',
    image: null
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, 'Username must be at least 3 characters')
      .required('Required'),
    name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    image: Yup.mixed().required('Profile image is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Required')
  });
  const [signUp] =useSignUpMutation()
  const [logInUser] = useLoginMutation()
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setServerError('');
    const formData = new FormData();
    formData.append('username', values.username);
    formData.append('name', values.name);
    formData.append('email', values.email);
    formData.append('password', values.password);
    formData.append('avatar', values.image);

    try {
      const response = await signUp(formData) 
       
        
      if (!response?.data) {
        setServerError(response.error?.data?.error || 'Signup failed');
      } else {
        resetForm();
         
        const loginResponse = await logInUser({
          identifier: values.email,  
          password:   values.password
        })
        if (!loginResponse?.data) {
          setServerError(loginResponse.error?.data?.error || 'Login failed');
        } else {
      
          onSuccess(loginResponse.data);
           navigate('/');
        }
      }
    } catch (error) {
      setServerError(error.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="vh-100 bg-light">
      <Row className="h-100">
        {/* Left Info Panel */}
        <Col md={5} className="d-none d-md-flex flex-column justify-content-center align-items-start px-5" style={{ backgroundColor: '#f0f4ff' }}>
          <h1 className="display-4 fw-bold text-primary">Sign Up</h1>
          <h4 className="fw-bold">registration form</h4>
          <p className="text-muted mt-3">Password entry step and error output</p>
        </Col>

        {/* Signup Form */}
        <Col xs={12} md={7} className="d-flex justify-content-center align-items-center p-4">
          <Card className="w-75 shadow-sm rounded-4">
            <Card.Body>
              <h3 className="text-center mb-2">Sign Up</h3>
              <p className="text-center text-muted mb-4">
                Let's get started. Ready to be part of something new? Move forward with us.
              </p>

              {serverError && <Alert variant="danger">{serverError}</Alert>}

              <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                {({ values, errors, touched, isSubmitting, isValid, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
                  <Form noValidate onSubmit={handleSubmit}>
                    <Form.Group controlId="username" className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={values.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.username && !!errors.username}
                        placeholder="Enter username"
                      />
                      <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.name && !!errors.name}
                        placeholder="Enter full name"
                      />
                      <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="email" className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && !!errors.email}
                        placeholder="Enter email"
                      />
                      <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="image" className="mb-3">
                      <Form.Label>Profile Image</Form.Label>
                      <Form.Control
                        type="file"
                        name="image"
                        onChange={e => setFieldValue('image', e.currentTarget.files[0])}
                        isInvalid={touched.image && !!errors.image}
                      />
                      <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                      {values.image && (
                        <div className="mt-3 text-center">
                          <Image src={URL.createObjectURL(values.image)} roundedCircle height={60} width={60} />
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group controlId="password" className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <FormControl
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.password && !!errors.password}
                          placeholder="Enter password"
                        />
                        <Button variant="outline-secondary" onClick={() => setShowPassword(p => !p)}>
                          {showPassword ? <EyeSlashFill /> : <EyeFill />}
                        </Button>
                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <div className="d-grid">
                      <Button variant="outline-primary" disabled={isSubmitting  } size="lg" type="submit">
                        {isSubmitting ? 'Signing up…' : 'Sign up'}
                      </Button>
                    </div>

                    {/* <hr className="my-4" /> */}

                    <div className="d-grid">
                      <Button variant="primary mt-2" onClick={() => navigate('/login')} size="lg">
                        <i className="bi bi-cd me-2" /> Sign In
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupForm;
