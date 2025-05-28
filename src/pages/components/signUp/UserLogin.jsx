// src/components/LoginForm.jsx
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
  InputGroup,
  FormControl
} from 'react-bootstrap';
import { EyeFill, EyeSlashFill } from 'react-bootstrap-icons';
import { useLoginMutation } from '../api/Contact';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onSuccess ,setActiveChatId}) => {
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login] = useLoginMutation();
  const navigate = useNavigate();

  const initialValues = {
    identifier: '',  // email or username
    password: ''
  };

  const validationSchema = Yup.object({
    identifier: Yup.string()
      .required('Email or username is required'),
    password: Yup.string()
      .required('Password is required')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setServerError('');
    try {
      const res = await login({
        identifier: values.identifier,
        password: values.password
      });
      if (res.error || !res.data) {
        setServerError(res.error?.data?.error || 'Login failed');
      } else {
        // store session & notify parent
      
        onSuccess(res.data);
        
        navigate('/');
        setActiveChatId(res?.data?.user?.id);
      }
    } catch (err) {
      setServerError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="vh-100 bg-light">
      <Row className="h-100">
        <Col xs={12} md={6} className="d-flex justify-content-center align-items-center p-4">
          <Card className="w-75 shadow-sm rounded-4">
            <Card.Body>
              <h3 className="text-center mb-4">Sign In</h3>

              {serverError && <Alert variant="danger">{serverError}</Alert>}

              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  isSubmitting,
                  handleChange,
                  handleBlur,
                  handleSubmit
                }) => (
                  <Form noValidate onSubmit={handleSubmit}>
                    {/* Identifier */}
                    <Form.Group controlId="identifier" className="mb-3">
                      <Form.Label>Email or Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="identifier"
                        value={values.identifier}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.identifier && !!errors.identifier}
                        placeholder="Enter email or username"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.identifier}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {/* Password */}
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
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(p => !p)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeSlashFill /> : <EyeFill />}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    {/* Sign In */}
                    <div className="d-grid mb-2">
                      <Button
                        variant="primary"
                        size="lg"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Signing in…' : 'Sign In'}
                      </Button>
                    </div>

                    {/* Sign Up */}
                    <div className="d-grid">
                      <Button
                        variant="outline-secondary"
                        size="lg"
                        onClick={() => navigate('/signup')}
                      >
                        Don’t have an account? Sign Up
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>

        {/* Optional side panel like in SignupForm */}
        <Col md={6} className="d-none d-md-flex flex-column justify-content-center align-items-start px-5" style={{ backgroundColor: '#f0f4ff' }}>
          <h1 className="display-4 fw-bold text-primary">Welcome Back</h1>
          <h4 className="fw-bold">Login to continue</h4>
          <p className="text-muted mt-3">Enter your credentials to access your chats.</p>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginForm;
